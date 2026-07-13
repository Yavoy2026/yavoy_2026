import React, { useRef, useCallback, useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Animated, Platform, ActivityIndicator } from "react-native";
import { Search, X, Mic, MicOff } from "lucide-react-native";
import { Audio } from "expo-av";
import { useTheme } from "@/providers/ThemeProvider";

const STT_URL = "https://toolkit.rork.com/stt/transcribe/";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default React.memo(function SearchBar({ value, onChangeText, placeholder = "Найти экскурсию..." }: SearchBarProps) {
  const { colors } = useTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleFocus = useCallback(() => {
    Animated.spring(focusAnim, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    Animated.spring(focusAnim, { toValue: 0, useNativeDriver: false, friction: 8 }).start();
  }, [focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.teal],
  });

  const startPulse = useCallback(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const transcribeAudio = useCallback(async (formData: FormData) => {
    setIsTranscribing(true);
    try {
      console.log("[SearchBar] Sending audio for transcription...");
      const response = await fetch(STT_URL, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        console.error("[SearchBar] STT response error:", response.status);
        return;
      }
      const result = await response.json() as { text: string; language: string };
      console.log("[SearchBar] Transcription result:", result.text);
      if (result.text && result.text.trim()) {
        onChangeText(result.text.trim());
      }
    } catch (err) {
      console.error("[SearchBar] Transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  }, [onChangeText]);

  const startRecordingNative = useCallback(async () => {
    try {
      console.log("[SearchBar] Requesting audio permissions...");
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn("[SearchBar] Audio permission denied");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
      console.log("[SearchBar] Recording started (native)");
    } catch (err) {
      console.error("[SearchBar] Failed to start recording:", err);
    }
  }, [startPulse]);

  const stopRecordingNative = useCallback(async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) return;
      console.log("[SearchBar] Stopping recording (native)...");
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      stopPulse();
      if (!uri) {
        console.warn("[SearchBar] No recording URI");
        return;
      }
      const uriParts = uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const audioFile = {
        uri,
        name: "recording." + fileType,
        type: "audio/" + fileType,
      };
      const formData = new FormData();
      formData.append("audio", audioFile as unknown as Blob);
      formData.append("language", "ru");
      await transcribeAudio(formData);
    } catch (err) {
      console.error("[SearchBar] Failed to stop recording:", err);
      setIsRecording(false);
      stopPulse();
    }
  }, [transcribeAudio, stopPulse]);

  const startRecordingWeb = useCallback(async () => {
    try {
      console.log("[SearchBar] Requesting microphone (web)...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("language", "ru");
        await transcribeAudio(formData);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startPulse();
      console.log("[SearchBar] Recording started (web)");
    } catch (err) {
      console.error("[SearchBar] Failed to start web recording:", err);
    }
  }, [transcribeAudio, startPulse]);

  const stopRecordingWeb = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      console.log("[SearchBar] Stopping recording (web)...");
      mediaRecorder.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    stopPulse();
  }, [stopPulse]);

  const handleMicPress = useCallback(async () => {
    if (isTranscribing) return;
    if (isRecording) {
      if (Platform.OS === "web") {
        stopRecordingWeb();
      } else {
        await stopRecordingNative();
      }
    } else {
      if (Platform.OS === "web") {
        await startRecordingWeb();
      } else {
        await startRecordingNative();
      }
    }
  }, [isRecording, isTranscribing, startRecordingNative, stopRecordingNative, startRecordingWeb, stopRecordingWeb]);

  const micColor = isRecording ? colors.coral : colors.textMuted;

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.inputBg, borderColor, shadowColor: colors.navy }]}>
      <Search size={18} color={colors.textMuted} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        testID="search-input"
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        onPress={handleMicPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.micButton, isRecording && { backgroundColor: "rgba(255, 107, 107, 0.12)" }]}
        activeOpacity={0.6}
        testID="voice-search-button"
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color={colors.teal} />
        ) : (
          <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
            {isRecording ? (
              <MicOff size={18} color={micColor} />
            ) : (
              <Mic size={18} color={micColor} />
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    gap: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

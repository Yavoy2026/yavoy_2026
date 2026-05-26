import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Send, Sparkles, UserCog, RefreshCw } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useSupport } from "@/providers/SupportProvider";

export default function SupportScreen() {
  const { colors } = useTheme();
  const { messages, sendMessage, isThinking, escalated, reset } = useSupport();
  const [text, setText] = useState<string>("");
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, isThinking]);

  const onSend = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    setText("");
    void sendMessage(t);
  }, [text, sendMessage]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Поддержка YAVOY",
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: "#FFFFFF",
          headerRight: () => (
            <TouchableOpacity onPress={reset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <RefreshCw size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.statusBanner, { backgroundColor: escalated ? colors.orangeLight : colors.tealSoft, borderColor: escalated ? colors.orange + "44" : colors.teal + "30" }]}>
        {escalated ? <UserCog size={16} color={colors.orange} /> : <Sparkles size={16} color={colors.teal} />}
        <Text style={[styles.statusText, { color: escalated ? colors.orange : colors.teal }]}>
          {escalated ? "Чат переведён на менеджера YAVOY" : "AI-консультант поможет подобрать тур"}
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {messages.map((m) => {
            const mine = m.role === "user";
            const isAgent = m.role === "agent";
            return (
              <View key={m.id} style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.teal }
                      : isAgent
                      ? { backgroundColor: colors.orangeLight, borderColor: colors.orange + "40", borderWidth: 1 }
                      : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  {!mine ? (
                    <View style={styles.bubbleHeader}>
                      {isAgent ? <UserCog size={12} color={colors.orange} /> : <Sparkles size={12} color={colors.teal} />}
                      <Text style={[styles.bubbleSender, { color: isAgent ? colors.orange : colors.teal }]}>
                        {isAgent ? "Менеджер YAVOY" : "AI YAVOY"}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.bubbleText, { color: mine ? "#FFFFFF" : colors.text }]}>{m.content}</Text>
                </View>
              </View>
            );
          })}
          {isThinking ? (
            <View style={[styles.row, styles.rowLeft]}>
              <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <ActivityIndicator size="small" color={colors.teal} />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={escalated ? "Сообщение менеджеру" : "Опишите, какой тур ищете"}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            testID="support-input"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.teal, opacity: text.trim() ? 1 : 0.5 }]}
            onPress={onSend}
            disabled={!text.trim() || isThinking}
            activeOpacity={0.8}
            testID="support-send"
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, margin: 12, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: "700" as const, flex: 1 },
  scroll: { paddingHorizontal: 12, paddingBottom: 16 },
  row: { marginBottom: 8, flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" as const },
  rowRight: { justifyContent: "flex-end" as const },
  bubble: { maxWidth: "82%", padding: 12, borderRadius: 16 },
  bubbleHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  bubbleSender: { fontSize: 10, fontWeight: "800" as const },
  bubbleText: { fontSize: 14, lineHeight: 19 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 120, minHeight: 42 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});

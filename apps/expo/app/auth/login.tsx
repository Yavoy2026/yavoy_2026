import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, KeyRound, User, ArrowLeft, ArrowRight } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ApiError } from "@/services/api";

type Step = "email" | "code" | "name";

const RESEND_COOLDOWN_SEC = 60;

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [resendIn, setResendIn] = useState<number>(0);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const sendCode = useCallback(async () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setLoading(true);
    try {
      await auth.requestOtp(trimmed);
      setStep("code");
      setCode("");
      setResendIn(RESEND_COOLDOWN_SEC);
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "otp_cooldown") {
        // код уже улетел раньше — просто переходим к вводу
        const retry = Number(e.details?.retry_after_sec ?? RESEND_COOLDOWN_SEC);
        setStep("code");
        setResendIn(retry);
      } else {
        setError(e instanceof Error ? e.message : "Не удалось отправить код");
      }
    } finally {
      setLoading(false);
    }
  }, [email, auth]);

  const submitCode = useCallback(async () => {
    setError("");
    if (code.length !== 6) {
      setError("Код состоит из 6 цифр");
      return;
    }
    setLoading(true);
    try {
      const result = await auth.verifyOtp(email.trim(), code);
      if (result.is_new_user) {
        setStep("name");
      } else {
        router.replace("/");
      }
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "otp_wrong_code") {
        setError("Неверный код, попробуйте ещё раз");
      } else if (e instanceof ApiError && e.code === "otp_invalid_or_expired") {
        setError("Код истёк или использован. Запросите новый.");
        setStep("email");
      } else if (e instanceof ApiError && e.code === "user_deactivated") {
        setError("Аккаунт деактивирован. Обратитесь к администратору.");
      } else {
        setError(e instanceof Error ? e.message : "Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  }, [email, code, auth, router]);

  const submitName = useCallback(async () => {
    setError("");
    const trimmed = firstName.trim();
    if (!trimmed) {
      setError("Как к вам обращаться?");
      return;
    }
    setLoading(true);
    try {
      await auth.updateMyProfile({ first_name: trimmed });
      router.replace("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить имя");
    } finally {
      setLoading(false);
    }
  }, [firstName, auth, router]);

  const goBack = useCallback(() => {
    setError("");
    if (step === "code") setStep("email");
    else router.back();
  }, [step, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {step !== "name" ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.teal }]}>
            <Text style={styles.logoText}>YV</Text>
          </View>
          {step === "email" ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Вход без пароля</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Введите email — пришлём код для входа.{"\n"}Регистрация не нужна.
              </Text>
            </>
          ) : step === "code" ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Код из письма</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Отправили 6 цифр на{"\n"}
                <Text style={{ fontWeight: "600", color: colors.text }}>{email.trim()}</Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Приятно познакомиться!</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Как вас зовут?</Text>
            </>
          )}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
            <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {step === "email" ? (
            <>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Mail size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  inputMode="email"
                  onSubmitEditing={sendCode}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }]}
                onPress={sendCode}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Получить код</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : step === "code" ? (
            <>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <KeyRound size={18} color={colors.textMuted} />
                <TextInput
                  ref={codeInputRef}
                  style={[styles.input, styles.codeInput, { color: colors.text }]}
                  placeholder="••••••"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  onSubmitEditing={submitCode}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }]}
                onPress={submitCode}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Войти</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchLink}
                onPress={sendCode}
                activeOpacity={0.7}
                disabled={resendIn > 0 || loading}
              >
                <Text style={[styles.switchText, { color: colors.textMuted }]}>
                  {resendIn > 0 ? (
                    `Отправить код ещё раз через ${resendIn} с`
                  ) : (
                    <Text style={{ color: colors.teal, fontWeight: "600" }}>Отправить код ещё раз</Text>
                  )}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Имя"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                  textContentType="givenName"
                  onSubmitEditing={submitName}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }]}
                onPress={submitName}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Готово</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  backBtn: { position: "absolute", top: 60, left: 24, zIndex: 10 },
  header: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 20, textAlign: "center" },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, lineHeight: 18 },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  codeInput: { fontSize: 22, letterSpacing: 8, fontWeight: "600" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 50,
    gap: 8,
    marginTop: 8,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  switchLink: { alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 14 },
});

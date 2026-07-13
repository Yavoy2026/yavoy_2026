import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Check } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [firstName, setFirstName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const passwordChecks = {
    minLength: password.length >= 8,
    hasCapital: /[A-ZА-ЯЁ]/.test(password),
    hasDigit: /\d/.test(password),
  };

  const canSubmit =
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordChecks.minLength &&
    passwordChecks.hasCapital &&
    passwordChecks.hasDigit;

  const handleRegister = useCallback(async () => {
    setError("");
    if (!canSubmit) return;
    setLoading(true);
    try {
      const user = await auth.register(email.trim(), password, firstName.trim());
      console.log("[Register] Success, role:", user.role);
      router.replace("/");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Ошибка регистрации.";
      if (msg.includes("already exists") || msg.includes("409")) {
        setError("Пользователь с таким email уже зарегистрирован");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [firstName, email, password, canSubmit, auth, router]);

  const CheckRow = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={styles.checkRow}>
      <Check size={14} color={ok ? colors.green : colors.textMuted} />
      <Text
        style={[
          styles.checkLabel,
          { color: ok ? colors.green : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.teal }]}>
            <Text style={styles.logoText}>YV</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Присоединяйтесь!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Создайте аккаунт и открывайте новые горизонты
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
            <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
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
            />
          </View>

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
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Lock size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Пароль"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.checksCard}>
            <CheckRow ok={passwordChecks.minLength} label="Минимум 8 символов" />
            <CheckRow ok={passwordChecks.hasCapital} label="Минимум 1 заглавная буква" />
            <CheckRow ok={passwordChecks.hasDigit} label="Минимум 1 цифра" />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: canSubmit ? colors.teal : colors.gray200,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.submitText, { color: canSubmit ? "#FFFFFF" : colors.textMuted }]}>
                Зарегистрироваться
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace("/auth/login")}
            activeOpacity={0.7}
          >
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              Уже есть аккаунт?{" "}
              <Text style={{ color: colors.teal, fontWeight: "600" }}>
                Войти
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingVertical: 40 },
  backBtn: { position: "absolute", top: 60, left: 24, zIndex: 10 },
  header: { alignItems: "center", marginBottom: 28 },
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
  subtitle: { fontSize: 15, lineHeight: 20 },
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
  checksCard: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 6,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkLabel: { fontSize: 13, lineHeight: 18 },
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 50,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: "600" },
  switchLink: { alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 14 },
});

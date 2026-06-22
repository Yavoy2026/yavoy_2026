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
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = useCallback(async () => {
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const user = await auth.login(trimmedEmail, password);
      console.log("[Login] Success, role:", user.role);
      router.replace("/");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Ошибка входа. Попробуйте позже.";
      if (msg.includes("Wrong email") || msg.includes("password")) {
        setError("Неверный email или пароль");
      } else if (msg.includes("Inactive")) {
        setError("Аккаунт деактивирован. Обратитесь к администратору.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, auth, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
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
            С возвращением!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Войдите, чтобы продолжить путешествия
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
            <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
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
              autoComplete="password"
              textContentType="password"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <LogIn size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Войти</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.7}
          >
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              Нет аккаунта?{" "}
              <Text style={{ color: colors.teal, fontWeight: "600" }}>
                Зарегистрироваться
              </Text>
            </Text>
          </TouchableOpacity>
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

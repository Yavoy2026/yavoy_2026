import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerOffer } from "@yavoy/legal";
import { Stack, useRouter } from "expo-router";
import { Building2, Check, CheckCircle, Clock, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { ThemeColors } from "@/constants/colors";
import { translateError } from "@/i18n/errors";
import { useAuth } from "@/providers/AuthProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { fetchMyApplication, submitApplication, type ApplicationForm } from "@/services/partners";

const EMPTY: ApplicationForm = { org_name: "", inn: "", phone: "", description: "" };

/**
 * Заявка на партнёрство (YAV-29). Раньше здесь был демо-кабинет на моках —
 * фейковые заявки, гости и выручка. Управление турами живёт в веб-панели,
 * а на телефоне нужна ровно подача заявки: это разовое действие.
 */
export default function PartnerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t, formatDate } = useI18n();
  const auth = useAuth();

  const application = useQuery({
    queryKey: ["my-application"],
    queryFn: fetchMyApplication,
    enabled: auth.isAuthenticated,
  });

  const [form, setForm] = useState<ApplicationForm>(EMPTY);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof ApplicationForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = useMutation({
    mutationFn: () => submitApplication(form),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["my-application"] });
    },
    onError: (e: unknown) => setError(translateError(e, t)),
  });

  const header = (
    <Stack.Screen
      options={{
        title: t("partner.heroTitle"),
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.white,
      }}
    />
  );

  const canSubmit =
    accepted && form.org_name.trim().length > 1 && form.inn.trim().length >= 4 && !submit.isPending;

  if (!auth.isAuthenticated) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        {header}
        <Text style={[styles.note, { color: colors.textSecondary }]}>{t("partner.authRequiredText")}</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.teal }]}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.primaryBtnText}>{t("common.loginOrRegister")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // уже партнёр — управление турами только в вебе, здесь показывать нечего
  if (auth.role === "partner") {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        {header}
        <CheckCircle size={40} color={colors.mint} />
        <Text style={[styles.statusTitle, { color: colors.text }]}>{t("partner.alreadyPartner")}</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>{t("partner.cabinetOnWeb")}</Text>
      </View>
    );
  }

  if (application.isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        {header}
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  const current = application.data;

  if (current?.status === "pending") {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        {header}
        <Clock size={40} color={colors.gold} />
        <Text style={[styles.statusTitle, { color: colors.gold }]}>{t("partner.statusPending")}</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          {t("partner.statusPendingText", { org: current.org_name, date: formatDate(current.created_at) })}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("partner.heroSubtitle")}</Text>

        {current?.status === "rejected" ? (
          <View style={[styles.rejected, { backgroundColor: colors.coral + "1A", borderColor: colors.coral + "4D" }]}>
            <XCircle size={16} color={colors.coral} />
            <View style={styles.flex}>
              <Text style={[styles.rejectedTitle, { color: colors.coral }]}>{t("partner.statusRejected")}</Text>
              {/* причина обязательна на бэкенде — заявитель должен знать, что исправлять */}
              <Text style={[styles.note, { color: colors.textSecondary }]}>{current.comment}</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <Building2 size={18} color={colors.teal} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("partner.formTitle")}</Text>
          </View>

          <Field colors={colors} label={t("partner.fieldOrg")} value={form.org_name} onChange={(v) => set("org_name", v)} />
          <Field colors={colors} label={t("partner.fieldTaxId")} value={form.inn} onChange={(v) => set("inn", v)} keyboard="number-pad" />
          <Field colors={colors} label={t("partner.fieldPhone")} value={form.phone} onChange={(v) => set("phone", v)} keyboard="phone-pad" />
          <Field colors={colors} label={t("partner.fieldAbout")} value={form.description} onChange={(v) => set("description", v)} multiline />

          <TouchableOpacity style={styles.accept} activeOpacity={0.7} onPress={() => setAccepted((v) => !v)}>
            <View style={[styles.box, { borderColor: accepted ? colors.teal : colors.border, backgroundColor: accepted ? colors.teal : "transparent" }]}>
              {accepted ? <Check size={13} color={colors.white} /> : null}
            </View>
            <Text style={[styles.acceptText, { color: colors.textSecondary }]}>
              {t("partner.acceptOfferPrefix")}
              <Text
                style={[styles.link, { color: colors.teal }]}
                onPress={() => router.push({ pathname: "/legal", params: { doc: "partner_offer" } })}
              >
                {t("partner.offerDocName")}
              </Text>
            </Text>
          </TouchableOpacity>

          {error ? <Text style={[styles.error, { color: colors.coral }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: canSubmit ? colors.teal : colors.border }]}
            disabled={!canSubmit}
            onPress={() => submit.mutate()}
          >
            {submit.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>{t("partner.submitApplication")}</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.version, { color: colors.textMuted }]}>
            {t("partner.offerVersionNote", { version: partnerOffer.version })}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  colors,
  label,
  value,
  onChange,
  multiline,
  keyboard,
}: {
  colors: ThemeColors;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: "number-pad" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  statusTitle: { fontSize: 17, fontWeight: "800" as const, textAlign: "center" },
  note: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  rejected: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 14, padding: 12 },
  rejectedTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 2 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800" as const },
  field: { gap: 4 },
  label: { fontSize: 12, fontWeight: "600" as const },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  accept: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  acceptText: { flex: 1, fontSize: 13, lineHeight: 19 },
  link: { fontWeight: "700" as const },
  error: { fontSize: 13 },
  primaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", paddingHorizontal: 24 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  version: { fontSize: 11, lineHeight: 16 },
});

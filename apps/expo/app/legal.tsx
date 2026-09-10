import { findPlaceholders, LEGAL_DOCS, type LegalDocId } from "@yavoy/legal";
import { Stack, useLocalSearchParams } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";

const isDocId = (v: unknown): v is LegalDocId =>
  v === "offer" || v === "partner_offer" || v === "privacy";

/**
 * Юридические документы: покупательская оферта, оферта для организаторов
 * и политика конфиденциальности. Текст берётся из общего пакета @yavoy/legal —
 * тот же, что на вебе, чтобы редакции не разъезжались между платформами.
 */
export default function LegalScreen() {
  const { colors } = useTheme();
  const { t, formatDate } = useI18n();
  const params = useLocalSearchParams<{ doc?: string }>();
  const doc = LEGAL_DOCS[isDocId(params.doc) ? params.doc : "offer"];
  const placeholders = useMemo(() => findPlaceholders(doc), [doc]);
  const revision = doc.updatedAt.startsWith("‹") ? doc.updatedAt : formatDate(doc.updatedAt);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: doc.title,
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.white,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.revision, { color: colors.textMuted }]}>{t("legal.updatedAt", { date: revision })}</Text>

        {placeholders.length > 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.gold + "1A", borderColor: colors.gold + "4D" }]}>
            <AlertTriangle size={16} color={colors.gold} />
            <Text style={[styles.noticeText, { color: colors.gold }]}>{t("legal.draftNotice")}</Text>
          </View>
        ) : null}

        {doc.intro.map((paragraph, i) => (
          <Text key={`intro-${i}`} style={[styles.paragraph, { color: colors.textSecondary }]}>
            {paragraph}
          </Text>
        ))}

        {doc.sections.map((section) => (
          <View key={section.no} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{`${section.no}. ${section.title}`}</Text>
            {section.body.map((line, i) => (
              <Text key={i} style={[styles.paragraph, { color: colors.textSecondary }]}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  revision: { fontSize: 13, marginBottom: 12 },
  notice: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  paragraph: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, marginBottom: 8 },
});

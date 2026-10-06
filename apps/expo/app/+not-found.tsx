import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Compass } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useT } from "@/providers/I18nProvider";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const t = useT();
  console.log("[NotFoundScreen] Page not found");
  return (
    <>
      <Stack.Screen options={{ title: t("notFound.screenTitle") }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Compass size={48} color={colors.teal} />
        <Text style={[styles.title, { color: colors.text }]}>{t("notFound.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("notFound.subtitle")}</Text>
        <Link href="/" style={[styles.link, { backgroundColor: colors.teal }]}>
          <Text style={styles.linkText}>{t("common.home")}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" as const, marginTop: 8 },
  subtitle: { fontSize: 15, textAlign: "center" as const, lineHeight: 22, maxWidth: 280 },
  link: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  linkText: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" as const },
});


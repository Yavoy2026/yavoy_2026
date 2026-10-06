import { LOCALE_LABELS, type Locale } from "@yavoy/i18n";
import { Check, ChevronDown, Languages } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useI18n } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";

/** Переключатель языка. Скрыт, если сервер отдал единственный язык. */
export default React.memo(function LanguageSelector() {
  const { colors } = useTheme();
  const { locale, supported, setLocale, t } = useI18n();
  const [open, setOpen] = useState<boolean>(false);

  const select = useCallback(
    (next: Locale) => {
      setLocale(next);
      setOpen(false);
    },
    [setLocale],
  );

  if (supported.length < 2) return null;

  return (
    <View>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        testID="language-selector"
      >
        <Languages size={16} color={colors.teal} />
        <ChevronDown size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {open && (
        <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <View
              style={[
                styles.dropdown,
                { backgroundColor: colors.surface },
                Platform.select({
                  ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
                  android: { elevation: 12 },
                  web: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
                }),
              ]}
            >
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>{t("profile.language")}</Text>
              </View>
              {supported.map((code) => {
                const isActive = locale === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.option, isActive && { backgroundColor: colors.tealSoft }, { borderBottomColor: colors.border }]}
                    onPress={() => select(code)}
                    activeOpacity={0.6}
                    testID={`language-option-${code}`}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isActive ? { color: colors.text, fontWeight: "700" as const } : { color: colors.textSecondary },
                      ]}
                    >
                      {LOCALE_LABELS[code]}
                    </Text>
                    {isActive && <Check size={18} color={colors.teal} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dropdown: { borderRadius: 16, overflow: "hidden", width: "100%", maxWidth: 320 },
  dropdownHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10, borderBottomWidth: 1 },
  dropdownTitle: { fontSize: 16, fontWeight: "700" as const },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 15, fontWeight: "500" as const },
});

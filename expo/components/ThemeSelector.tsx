import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Sun, Moon, Smartphone, ChevronDown, Check } from "lucide-react-native";
import { useTheme, ThemeMode } from "@/providers/ThemeProvider";

const themeOptions: { key: ThemeMode; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: "system", label: "Системная", icon: Smartphone },
  { key: "light", label: "Светлая", icon: Sun },
  { key: "dark", label: "Тёмная", icon: Moon },
];

export default React.memo(function ThemeSelector() {
  const { themeMode, setTheme, colors } = useTheme();
  const [open, setOpen] = useState<boolean>(false);

  const current = themeOptions.find((o) => o.key === themeMode) || themeOptions[0];
  const CurrentIcon = current.icon;

  const handleSelect = useCallback(
    (key: ThemeMode) => {
      setTheme(key);
      setOpen(false);
    },
    [setTheme]
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        testID="theme-selector"
      >
        <CurrentIcon size={16} color={colors.teal} />
        <ChevronDown size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {open && (
        <Modal
          transparent
          visible={open}
          animationType="fade"
          onRequestClose={() => setOpen(false)}
          statusBarTranslucent
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <View style={[styles.dropdown, { backgroundColor: colors.surface }, Platform.select({
              ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
              android: { elevation: 12 },
              web: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
            })]}>
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>{"Тема оформления"}</Text>
              </View>
              {themeOptions.map((option) => {
                const isActive = themeMode === option.key;
                const OptionIcon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.option, isActive && { backgroundColor: colors.tealSoft }, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelect(option.key)}
                    activeOpacity={0.6}
                    testID={`theme-option-${option.key}`}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.iconCircle, isActive ? { backgroundColor: colors.teal } : { backgroundColor: colors.surfaceSecondary }]}>
                        <OptionIcon size={16} color={isActive ? "#FFFFFF" : colors.textMuted} />
                      </View>
                      <Text style={[styles.optionText, isActive ? { color: colors.text, fontWeight: "700" as const } : { color: colors.textSecondary }]}>
                        {option.label}
                      </Text>
                    </View>
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
  dropdown: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    maxWidth: 320,
  },
  dropdownHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
});

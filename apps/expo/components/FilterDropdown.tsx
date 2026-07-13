import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import {
  ChevronDown,
  Car,
  Waves,
  Ship,
  Bike,
  Plane,
  Sun,
  Moon,
  Building2,
  BookOpen,
  TreePine,
  Church,
  Check,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface FilterDropdownProps<T extends string> {
  label: string;
  options: { key: T; label: string; icon?: string }[];
  selected: T | null;
  onSelect: (key: T | null) => void;
}

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  car: Car,
  waves: Waves,
  ship: Ship,
  bike: Bike,
  plane: Plane,
  sun: Sun,
  moon: Moon,
  building: Building2,
  book: BookOpen,
  tree: TreePine,
  church: Church,
};

function FilterDropdownInner<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: FilterDropdownProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<boolean>(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const selectedOption = options.find((o) => o.key === selected);

  const toggleOpen = useCallback(() => {
    const toValue = open ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setOpen(!open);
  }, [open, rotateAnim]);

  const handleSelect = useCallback(
    (key: T) => {
      onSelect(selected === key ? null : key);
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      setOpen(false);
    },
    [selected, onSelect, rotateAnim]
  );

  const handleClose = useCallback(() => {
    Animated.spring(rotateAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setOpen(false);
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: colors.surface, borderColor: colors.border },
          open && { borderColor: colors.teal, backgroundColor: colors.surfaceSecondary },
          selected != null && { backgroundColor: colors.teal, borderColor: colors.teal },
        ]}
        onPress={toggleOpen}
        activeOpacity={0.7}
        testID={`filter-dropdown-${label}`}
      >
        {selectedOption?.icon && iconMap[selectedOption.icon] ? (
          React.createElement(iconMap[selectedOption.icon], {
            size: 15,
            color: selected != null ? "#FFFFFF" : colors.textSecondary,
          })
        ) : null}
        <Text
          style={[
            styles.triggerText,
            { color: colors.textSecondary },
            selected != null && { color: "#FFFFFF" },
          ]}
        >
          {selectedOption ? selectedOption.label : label}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown
            size={16}
            color={selected != null ? "#FFFFFF" : colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <Modal
          transparent
          visible={open}
          animationType="fade"
          onRequestClose={handleClose}
          statusBarTranslucent
        >
          <Pressable style={styles.backdrop} onPress={handleClose}>
            <View style={[styles.dropdownContainer, { backgroundColor: colors.surface }, Platform.select({
              ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
              android: { elevation: 12 },
              web: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
            })]}>
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>{label}</Text>
              </View>
              {options.map((option) => {
                const isActive = selected === option.key;
                const IconComponent = option.icon ? iconMap[option.icon] : null;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.tealSoft },
                    ]}
                    onPress={() => handleSelect(option.key)}
                    activeOpacity={0.6}
                    testID={`dropdown-option-${option.key}`}
                  >
                    <View style={styles.dropdownItemLeft}>
                      {IconComponent ? (
                        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceSecondary }, isActive ? { backgroundColor: colors.teal } : undefined]}>
                          <IconComponent
                            size={16}
                            color={isActive ? "#FFFFFF" : colors.textSecondary}
                          />
                        </View>
                      ) : null}
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: colors.textSecondary },
                          isActive && { color: colors.text, fontWeight: "700" as const },
                        ]}
                      >
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
}

export default React.memo(FilterDropdownInner) as typeof FilterDropdownInner;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 80,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dropdownContainer: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    maxWidth: 340,
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
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
});

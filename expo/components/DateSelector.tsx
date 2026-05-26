import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { CalendarDays, ChevronDown, Check, X } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface DateSelectorProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const monthShort = MONTHS_RU[d.getMonth()].slice(0, 3).toLowerCase();
  return `${day} ${monthShort}`;
}

export default React.memo(function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<boolean>(false);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleSelectDay = useCallback((day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${m}-${d}`;
    onSelectDate(dateStr);
    setOpen(false);
  }, [viewYear, viewMonth, onSelectDate]);

  const handleClear = useCallback(() => {
    onSelectDate(null);
    setOpen(false);
  }, [onSelectDate]);

  const handleOpen = useCallback(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
    setOpen(true);
  }, [selectedDate, today]);

  const isPastMonth = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDay, daysInMonth]);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: selectedDate ? colors.teal + "18" : colors.inputBg,
            borderColor: selectedDate ? colors.teal : colors.border,
          },
        ]}
        onPress={handleOpen}
        activeOpacity={0.7}
        testID="date-selector"
      >
        <CalendarDays size={16} color={selectedDate ? colors.teal : colors.textMuted} />
        {selectedDate ? (
          <Text style={[styles.triggerText, { color: colors.teal }]}>{formatDateShort(selectedDate)}</Text>
        ) : null}
        <ChevronDown size={14} color={selectedDate ? colors.teal : colors.textMuted} />
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
            <Pressable
              style={[
                styles.dropdown,
                { backgroundColor: colors.surface },
                Platform.select({
                  ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
                  android: { elevation: 14 },
                  web: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
                }),
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>{"Дата экскурсии"}</Text>
                {selectedDate ? (
                  <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <View style={[styles.clearBtn, { backgroundColor: colors.surfaceSecondary }]}>
                      <X size={14} color={colors.textMuted} />
                      <Text style={[styles.clearText, { color: colors.textMuted }]}>{"Сбросить"}</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  disabled={isPastMonth}
                  style={[styles.monthArrow, isPastMonth && { opacity: 0.3 }]}
                >
                  <Text style={[styles.monthArrowText, { color: colors.teal }]}>{"‹"}</Text>
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                  {`${MONTHS_RU[viewMonth]} ${viewYear}`}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
                  <Text style={[styles.monthArrowText, { color: colors.teal }]}>{"›"}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {WEEKDAYS_RU.map((wd) => (
                  <Text key={wd} style={[styles.weekday, { color: colors.textMuted }]}>{wd}</Text>
                ))}
              </View>

              <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.daysGrid}>
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <View key={`empty-${idx}`} style={styles.dayCell} />;
                    }
                    const m = String(viewMonth + 1).padStart(2, "0");
                    const d = String(day).padStart(2, "0");
                    const dateStr = `${viewYear}-${m}-${d}`;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isPast = new Date(dateStr) < new Date(todayStr) && !isToday;

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.dayCell,
                          isSelected && { backgroundColor: colors.teal, borderRadius: 20 },
                          isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.teal, borderRadius: 20 },
                        ]}
                        onPress={() => !isPast && handleSelectDay(day)}
                        disabled={isPast}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: colors.text },
                            isPast && { color: colors.textMuted, opacity: 0.4 },
                            isSelected && { color: "#FFFFFF", fontWeight: "700" as const },
                            isToday && !isSelected && { color: colors.teal, fontWeight: "700" as const },
                          ]}
                        >
                          {String(day)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={[styles.quickDates, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: colors.teal + "14" }]}
                  onPress={() => {
                    onSelectDate(todayStr);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.quickBtnText, { color: colors.teal }]}>{"Сегодня"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: colors.teal + "14" }]}
                  onPress={() => {
                    const tom = new Date(today);
                    tom.setDate(tom.getDate() + 1);
                    const y = tom.getFullYear();
                    const m2 = String(tom.getMonth() + 1).padStart(2, "0");
                    const d2 = String(tom.getDate()).padStart(2, "0");
                    onSelectDate(`${y}-${m2}-${d2}`);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.quickBtnText, { color: colors.teal }]}>{"Завтра"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: colors.teal + "14" }]}
                  onPress={() => {
                    const wknd = new Date(today);
                    const dayOfWeek = wknd.getDay();
                    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
                    wknd.setDate(wknd.getDate() + daysUntilSat);
                    const y = wknd.getFullYear();
                    const m2 = String(wknd.getMonth() + 1).padStart(2, "0");
                    const d2 = String(wknd.getDate()).padStart(2, "0");
                    onSelectDate(`${y}-${m2}-${d2}`);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.quickBtnText, { color: colors.teal }]}>{"Выходные"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
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
  triggerText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dropdown: {
    borderRadius: 18,
    overflow: "hidden",
    width: "100%",
    maxWidth: 360,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  clearText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  monthArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowText: {
    fontSize: 28,
    fontWeight: "300" as const,
    lineHeight: 32,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  weekdaysRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  calendarScroll: {
    maxHeight: 260,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  quickDates: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});

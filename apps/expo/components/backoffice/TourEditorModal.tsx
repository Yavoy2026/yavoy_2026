import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import type { ThemeColors } from "@/constants/colors";
import {
  addTourDate,
  createTour,
  deleteTourDate,
  fetchTourDates,
  updateTour,
  updateTourDate,
  type BackofficeTour,
  type TourWritePayload,
} from "@/services/backoffice";

const DURATIONS = [
  { v: "one_day", l: "Однодневный" },
  { v: "multi_day", l: "Многодневный" },
] as const;
const TRANSPORTS = [
  { v: "auto", l: "Авто" },
  { v: "water", l: "Вода" },
  { v: "sea", l: "Море" },
  { v: "bike", l: "Вело" },
  { v: "air", l: "Авиа" },
] as const;
const INTERESTS = [
  { v: "city", l: "Город" },
  { v: "educational", l: "Познавательный" },
  { v: "nature", l: "Природа" },
  { v: "pilgrimage", l: "Паломничество" },
] as const;

interface FormState {
  city_id: string;
  title: string;
  description: string;
  image_url: string;
  gallery: string;
  price_rub: string;
  original_price_rub: string;
  duration_type: "one_day" | "multi_day";
  duration_text: string;
  transport: BackofficeTour["transport"];
  interest: BackofficeTour["interest"];
  organizer_name: string;
  highlights: string;
  includes: string;
  excludes: string;
  what_to_bring: string;
  languages: string;
  schedule: string;
  group_size: string;
  meeting_point: string;
  start_time: string;
  booking_conditions: string;
  prepayment: string;
  cancellation_policy: string;
  is_instant_confirmation: boolean;
  is_free_cancellation: boolean;
  is_bestseller: boolean;
}

const lines = (s: string): string[] => s.split("\n").map((l) => l.trim()).filter(Boolean);
const joinLines = (a: string[]): string => a.join("\n");
const rub = (kopeks: number | null): string => (kopeks === null ? "" : String(Math.round(kopeks / 100)));

function initialForm(tour: BackofficeTour | null, defaultCity: string): FormState {
  return {
    city_id: tour?.city_id ?? defaultCity,
    title: tour?.title ?? "",
    description: tour?.description ?? "",
    image_url: tour?.image_url ?? "",
    gallery: joinLines(tour?.gallery ?? []),
    price_rub: tour ? rub(tour.price_kopeks) : "",
    original_price_rub: rub(tour?.original_price_kopeks ?? null),
    duration_type: tour?.duration_type ?? "one_day",
    duration_text: tour?.duration_text ?? "",
    transport: tour?.transport ?? "auto",
    interest: tour?.interest ?? "city",
    organizer_name: tour?.organizer.name ?? "YaVoy Travel Group",
    highlights: joinLines(tour?.highlights ?? []),
    includes: joinLines(tour?.includes ?? []),
    excludes: joinLines(tour?.excludes ?? []),
    what_to_bring: joinLines(tour?.what_to_bring ?? []),
    languages: joinLines(tour?.languages ?? ["Русский"]),
    schedule: tour?.schedule ?? "",
    group_size: tour?.group_size ?? "",
    meeting_point: tour?.meeting_point ?? "",
    start_time: tour?.start_time ?? "",
    booking_conditions: tour?.booking_conditions ?? "",
    prepayment: tour?.prepayment ?? "",
    cancellation_policy: tour?.cancellation_policy ?? "",
    is_instant_confirmation: tour?.is_instant_confirmation ?? false,
    is_free_cancellation: tour?.is_free_cancellation ?? false,
    is_bestseller: tour?.is_bestseller ?? false,
  };
}

function toPayload(f: FormState, existing: BackofficeTour | null, isPartner: boolean): TourWritePayload {
  const payload: TourWritePayload = {
    city_id: f.city_id,
    title: f.title.trim(),
    description: f.description,
    image_url: f.image_url.trim(),
    gallery: lines(f.gallery),
    price_kopeks: Math.round(Number(f.price_rub) * 100),
    original_price_kopeks: f.original_price_rub ? Math.round(Number(f.original_price_rub) * 100) : null,
    duration_type: f.duration_type,
    duration_text: f.duration_text,
    transport: f.transport,
    interest: f.interest,
    highlights: lines(f.highlights),
    includes: lines(f.includes),
    excludes: lines(f.excludes),
    what_to_bring: lines(f.what_to_bring),
    languages: lines(f.languages),
    schedule: f.schedule || null,
    group_size: f.group_size || null,
    meeting_point: f.meeting_point || null,
    start_time: f.start_time || null,
    booking_conditions: f.booking_conditions || null,
    prepayment: f.prepayment || null,
    cancellation_policy: f.cancellation_policy || null,
    is_instant_confirmation: f.is_instant_confirmation,
    is_free_cancellation: f.is_free_cancellation,
    is_bestseller: f.is_bestseller,
  };
  // organizer партнёру не даём — сервер берёт его из профиля организации
  if (!isPartner) {
    payload.organizer = {
      id: existing?.organizer.id ?? "yavoy",
      name: f.organizer_name.trim() || "YaVoy Travel Group",
      rating: existing?.organizer.rating ?? 0,
      review_count: existing?.organizer.review_count ?? 0,
      avatar: existing?.organizer.avatar ?? null,
      verified: existing?.organizer.verified ?? true,
      tours_count: existing?.organizer.tours_count ?? 0,
    };
  }
  return payload;
}

export function TourEditorModal({
  tour,
  cities,
  isPartner,
  onClose,
  onError,
  onSuccess,
}: {
  tour: BackofficeTour | null;
  cities: { id: string; name: string }[];
  isPartner: boolean;
  onClose: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialForm(tour, cities[0]?.id ?? ""));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      if (!form.title.trim() || !form.image_url.trim() || !form.price_rub || !form.city_id) {
        throw new Error("Заполните обязательные поля: город, название, картинка, цена");
      }
      const payload = toPayload(form, tour, isPartner);
      return tour ? updateTour(tour.id, payload) : createTour(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["backoffice-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      onSuccess(tour ? "Тур сохранён" : "Тур создан черновиком");
      onClose();
    },
    onError: (e: unknown) => onError(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  const inputStyle = [styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }];
  const label = (t: string) => <Text style={[styles.label, { color: colors.textMuted }]}>{t}</Text>;

  const chipRow = <T extends string>(
    options: readonly { v: T; l: string }[],
    value: T,
    onSelect: (v: T) => void,
  ) => (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.v}
          onPress={() => onSelect(o.v)}
          style={[
            styles.chip,
            { backgroundColor: value === o.v ? colors.teal : colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.chipText, { color: value === o.v ? "#FFF" : colors.text }]}>{o.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {tour ? "Редактирование тура" : "Новый тур"}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Section title="Основное" colors={colors}>
            {label("Город *")}
            {chipRow(
              cities.map((c) => ({ v: c.id, l: c.name })),
              form.city_id,
              (v) => set("city_id", v),
            )}
            {label("Название *")}
            <TextInput style={inputStyle} value={form.title} onChangeText={(v) => set("title", v)} />
            {label("Описание")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.description} onChangeText={(v) => set("description", v)} multiline />
            {label("Картинка (URL) *")}
            <TextInput style={inputStyle} value={form.image_url} onChangeText={(v) => set("image_url", v)} autoCapitalize="none" />
            {label("Галерея (URL, по одному на строку)")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.gallery} onChangeText={(v) => set("gallery", v)} multiline autoCapitalize="none" />
          </Section>

          <Section title="Цена" colors={colors}>
            <View style={styles.row2}>
              <View style={styles.flex1}>
                {label("Цена, ₽ *")}
                <TextInput style={inputStyle} value={form.price_rub} onChangeText={(v) => set("price_rub", v.replace(/\D/g, ""))} keyboardType="number-pad" />
              </View>
              <View style={styles.flex1}>
                {label("До скидки, ₽")}
                <TextInput style={inputStyle} value={form.original_price_rub} onChangeText={(v) => set("original_price_rub", v.replace(/\D/g, ""))} keyboardType="number-pad" />
              </View>
            </View>
          </Section>

          <Section title="Классификация" colors={colors}>
            {label("Длительность")}
            {chipRow(DURATIONS, form.duration_type, (v) => set("duration_type", v))}
            {label("Текст длительности (например «8 часов»)")}
            <TextInput style={inputStyle} value={form.duration_text} onChangeText={(v) => set("duration_text", v)} />
            {label("Транспорт")}
            {chipRow(TRANSPORTS, form.transport, (v) => set("transport", v))}
            {label("Интерес")}
            {chipRow(INTERESTS, form.interest, (v) => set("interest", v))}
          </Section>

          {!isPartner && (
            <Section title="Организатор" colors={colors}>
              {label("Название организатора")}
              <TextInput style={inputStyle} value={form.organizer_name} onChangeText={(v) => set("organizer_name", v)} />
            </Section>
          )}

          <Section title="Программа (по пункту на строку)" colors={colors}>
            {label("Хайлайты")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.highlights} onChangeText={(v) => set("highlights", v)} multiline />
            {label("Включено")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.includes} onChangeText={(v) => set("includes", v)} multiline />
            {label("Не включено")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.excludes} onChangeText={(v) => set("excludes", v)} multiline />
            {label("Взять с собой")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.what_to_bring} onChangeText={(v) => set("what_to_bring", v)} multiline />
            {label("Языки")}
            <TextInput style={inputStyle} value={form.languages} onChangeText={(v) => set("languages", v)} />
          </Section>

          <Section title="Логистика" colors={colors}>
            {label("Расписание")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.schedule} onChangeText={(v) => set("schedule", v)} multiline />
            <View style={styles.row2}>
              <View style={styles.flex1}>
                {label("Размер группы")}
                <TextInput style={inputStyle} value={form.group_size} onChangeText={(v) => set("group_size", v)} />
              </View>
              <View style={styles.flex1}>
                {label("Время старта")}
                <TextInput style={inputStyle} value={form.start_time} onChangeText={(v) => set("start_time", v)} placeholder="09:00" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            {label("Место встречи")}
            <TextInput style={inputStyle} value={form.meeting_point} onChangeText={(v) => set("meeting_point", v)} />
          </Section>

          <Section title="Условия" colors={colors}>
            {label("Условия брони")}
            <TextInput style={[...inputStyle, styles.multiline]} value={form.booking_conditions} onChangeText={(v) => set("booking_conditions", v)} multiline />
            <View style={styles.row2}>
              <View style={styles.flex1}>
                {label("Предоплата")}
                <TextInput style={inputStyle} value={form.prepayment} onChangeText={(v) => set("prepayment", v)} />
              </View>
              <View style={styles.flex1}>
                {label("Политика отмены")}
                <TextInput style={inputStyle} value={form.cancellation_policy} onChangeText={(v) => set("cancellation_policy", v)} />
              </View>
            </View>
          </Section>

          <Section title="Витрина" colors={colors}>
            <SwitchRow label="Моментальное подтверждение" value={form.is_instant_confirmation} onChange={(v) => set("is_instant_confirmation", v)} colors={colors} />
            <SwitchRow label="Бесплатная отмена" value={form.is_free_cancellation} onChange={(v) => set("is_free_cancellation", v)} colors={colors} />
            <SwitchRow label="Бестселлер" value={form.is_bestseller} onChange={(v) => set("is_bestseller", v)} colors={colors} />
          </Section>

          {tour && <DatesPanel tourId={tour.id} colors={colors} onError={onError} onSuccess={onSuccess} />}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.teal, opacity: save.isPending ? 0.7 : 1 }]}
            onPress={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{tour ? "Сохранить" : "Создать черновик"}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DatesPanel({
  tourId,
  colors,
  onError,
  onSuccess,
}: {
  tourId: string;
  colors: ThemeColors;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const queryClient = useQueryClient();
  const dates = useQuery({ queryKey: ["backoffice-tour-dates", tourId], queryFn: () => fetchTourDates(tourId) });
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState("12");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["backoffice-tour-dates", tourId] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
  const err = (e: unknown) => onError(e instanceof Error ? e.message : "Ошибка");

  const add = useMutation({
    mutationFn: () => addTourDate(tourId, { starts_on: newDate.trim(), seats_total: Number(newSeats) }),
    onSuccess: () => { invalidate(); setNewDate(""); onSuccess("Дата добавлена"); },
    onError: err,
  });
  const changeSeats = useMutation({
    mutationFn: (vars: { dateId: string; seats: number }) => updateTourDate(tourId, vars.dateId, { seats_total: vars.seats }),
    onSuccess: () => { invalidate(); onSuccess("Вместимость изменена"); },
    onError: err,
  });
  const remove = useMutation({
    mutationFn: (dateId: string) => deleteTourDate(tourId, dateId),
    onSuccess: () => { invalidate(); onSuccess("Дата удалена"); },
    onError: err,
  });

  const validNewDate = /^\d{4}-\d{2}-\d{2}$/.test(newDate.trim());

  return (
    <Section title="Даты выездов" colors={colors}>
      {dates.isLoading ? (
        <ActivityIndicator color={colors.teal} />
      ) : (
        <>
          {(dates.data ?? []).map((d) => (
            <View key={d.id} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.dateText, { color: colors.text }]}>{d.starts_on}</Text>
              <Text style={[styles.dateBooked, { color: colors.textMuted }]}>занято {d.seats_total - d.seats_left}</Text>
              <SeatsInput
                initial={d.seats_total}
                colors={colors}
                onCommit={(v) => {
                  if (v !== d.seats_total && v >= 1) changeSeats.mutate({ dateId: d.id, seats: v });
                }}
              />
              <TouchableOpacity
                onPress={() => remove.mutate(d.id)}
                disabled={d.bookings_count > 0}
                style={[styles.dateDelBtn, { opacity: d.bookings_count > 0 ? 0.3 : 1 }]}
              >
                <Trash2 size={16} color={colors.red} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.dateAddRow}>
            <TextInput
              style={[styles.input, styles.flex1, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="ГГГГ-ММ-ДД"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.seatsInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={newSeats}
              onChangeText={(v) => setNewSeats(v.replace(/\D/g, ""))}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              onPress={() => add.mutate()}
              disabled={!validNewDate || add.isPending}
              style={[styles.dateAddBtn, { backgroundColor: colors.teal, opacity: !validNewDate || add.isPending ? 0.5 : 1 }]}
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </Section>
  );
}

/** Локальный стейт для поля мест: коммит по потере фокуса */
function SeatsInput({
  initial,
  colors,
  onCommit,
}: {
  initial: number;
  colors: ThemeColors;
  onCommit: (v: number) => void;
}) {
  const [value, setValue] = useState(String(initial));
  return (
    <TextInput
      style={[styles.input, styles.seatsInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
      value={value}
      onChangeText={(v) => setValue(v.replace(/\D/g, ""))}
      onBlur={() => onCommit(Number(value))}
      keyboardType="number-pad"
    />
  );
}

function Section({ title, colors, children }: { title: string; colors: ThemeColors; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.teal }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  row2: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 2 },
  switchLabel: { fontSize: 14, flex: 1 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateText: { fontSize: 14, fontWeight: "600", flex: 1 },
  dateBooked: { fontSize: 12 },
  seatsInput: { width: 64, textAlign: "center", paddingVertical: 6 },
  dateDelBtn: { padding: 6 },
  dateAddRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 },
  dateAddBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  saveBtn: { borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});

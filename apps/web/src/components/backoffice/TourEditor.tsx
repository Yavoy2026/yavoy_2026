import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import { translateError } from "@/i18n/errors";
import type { TKey } from "@/i18n/keys";
import {
  addTourDate,
  createTour,
  deleteTourDate,
  fetchTourDates,
  updateTour,
  updateTourDate,
  type AdminTour,
  type TourWritePayload,
} from "@/services/admin";

const DURATIONS = [
  { v: "one_day", l: "enums.durationSingular.one_day" },
  { v: "multi_day", l: "enums.durationSingular.multi_day" },
] as const satisfies readonly { v: string; l: TKey }[];
const TRANSPORTS = [
  { v: "auto", l: "enums.transport.auto" },
  { v: "water", l: "enums.transport.water" },
  { v: "sea", l: "enums.transport.sea" },
  { v: "bike", l: "enums.transport.bike" },
  { v: "air", l: "enums.transport.air" },
] as const satisfies readonly { v: string; l: TKey }[];
const INTERESTS = [
  { v: "city", l: "enums.interest.city" },
  { v: "educational", l: "enums.interest.educational" },
  { v: "nature", l: "enums.interest.nature" },
  { v: "pilgrimage", l: "enums.interest.pilgrimage" },
] as const satisfies readonly { v: string; l: TKey }[];
const CATEGORIES = [
  "agro", "photo", "ethno", "parents", "glamping",
  "animals", "mystic", "wild_animals", "wine", "gastro",
];
const SEASONS = ["winter", "spring", "summer", "autumn", "all_year"];

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
  transport: AdminTour["transport"];
  interest: AdminTour["interest"];
  category: string;
  season: string;
  organizer_name: string;
  organizer_verified: boolean;
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
  group_joining_conditions: string;
  is_instant_confirmation: boolean;
  is_free_cancellation: boolean;
  is_bestseller: boolean;
  is_likely_to_sell_out: boolean;
}

const lines = (s: string): string[] => s.split("\n").map((l) => l.trim()).filter(Boolean);
const joinLines = (a: string[]): string => a.join("\n");
const rub = (kopeks: number | null): string => (kopeks === null ? "" : String(Math.round(kopeks / 100)));

function initialForm(tour: AdminTour | null, defaultCity: string): FormState {
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
    category: tour?.category ?? "",
    season: tour?.season ?? "",
    organizer_name: tour?.organizer.name ?? "YaVoy Travel Group",
    organizer_verified: tour?.organizer.verified ?? true,
    highlights: joinLines(tour?.highlights ?? []),
    includes: joinLines(tour?.includes ?? []),
    excludes: joinLines(tour?.excludes ?? []),
    what_to_bring: joinLines(tour?.what_to_bring ?? []),
    // языки экскурсии хранятся кодами (enums.tourLanguage), см. YAV-25
    languages: joinLines(tour?.languages ?? ["ru"]),
    schedule: tour?.schedule ?? "",
    group_size: tour?.group_size ?? "",
    meeting_point: tour?.meeting_point ?? "",
    start_time: tour?.start_time ?? "",
    booking_conditions: tour?.booking_conditions ?? "",
    prepayment: tour?.prepayment ?? "",
    cancellation_policy: tour?.cancellation_policy ?? "",
    group_joining_conditions: tour?.group_joining_conditions ?? "",
    is_instant_confirmation: tour?.is_instant_confirmation ?? false,
    is_free_cancellation: tour?.is_free_cancellation ?? false,
    is_bestseller: tour?.is_bestseller ?? false,
    is_likely_to_sell_out: tour?.is_likely_to_sell_out ?? false,
  };
}

function toPayload(f: FormState, existing: AdminTour | null): TourWritePayload {
  return {
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
    category: f.category || null,
    season: f.season || null,
    organizer: {
      id: existing?.organizer.id ?? "yavoy",
      name: f.organizer_name.trim() || "YaVoy Travel Group",
      rating: existing?.organizer.rating ?? 0,
      review_count: existing?.organizer.review_count ?? 0,
      avatar: existing?.organizer.avatar ?? null,
      verified: f.organizer_verified,
      tours_count: existing?.organizer.tours_count ?? 0,
    },
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
    group_joining_conditions: f.group_joining_conditions || null,
    is_instant_confirmation: f.is_instant_confirmation,
    is_free_cancellation: f.is_free_cancellation,
    is_bestseller: f.is_bestseller,
    is_likely_to_sell_out: f.is_likely_to_sell_out,
  };
}

export function TourEditor({
  tour,
  cities,
  onClose,
}: {
  tour: AdminTour | null;
  cities: { id: string; name: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialForm(tour, cities[0]?.id ?? ""));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const t = useT();

  const save = useMutation({
    mutationFn: () => {
      if (!form.title.trim() || !form.image_url.trim() || !form.price_rub || !form.city_id) {
        throw new Error(t("tourEditor.requiredFields"));
      }
      const payload = toPayload(form, tour);
      return tour ? updateTour(tour.id, payload) : createTour(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t(tour ? "tourEditor.tourSaved" : "tourEditor.tourCreated"));
      onClose();
    },
    onError: (e: unknown) => toast.error(translateError(e, t, "backoffice.saveFailed")),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-4 w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{t(tour ? "tourEditor.titleEdit" : "tourEditor.titleNew")}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"><X size={18} /></button>
        </div>

        <div className="space-y-5">
          <Section title={t("tourEditor.sectionMain")}>
            <label className="block text-xs font-semibold text-muted-foreground">{t("tourEditor.city")}
              <select value={form.city_id} onChange={(e) => set("city_id", e.target.value)} className="input-base mt-1">
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Input label={t("tourEditor.name")} value={form.title} onChange={(v) => set("title", v)} />
            <TextArea label={t("tourEditor.description")} value={form.description} onChange={(v) => set("description", v)} rows={4} />
            <Input label={t("tourEditor.image")} value={form.image_url} onChange={(v) => set("image_url", v)} />
            <TextArea label={t("tourEditor.gallery")} value={form.gallery} onChange={(v) => set("gallery", v)} rows={3} />
          </Section>

          <Section title={t("tourEditor.sectionPrice")}>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("tourEditor.price")} type="number" value={form.price_rub} onChange={(v) => set("price_rub", v)} />
              <Input label={t("tourEditor.originalPrice")} type="number" value={form.original_price_rub} onChange={(v) => set("original_price_rub", v)} />
            </div>
          </Section>

          <Section title={t("tourEditor.sectionClassification")}>
            <div className="grid grid-cols-2 gap-3">
              <Select label={t("tourEditor.duration")} value={form.duration_type} onChange={(v) => set("duration_type", v as FormState["duration_type"])} options={DURATIONS} />
              <Input label={t("tourEditor.durationText")} value={form.duration_text} onChange={(v) => set("duration_text", v)} placeholder={t("tourEditor.durationPlaceholder")} />
              <Select label={t("tourEditor.transport")} value={form.transport} onChange={(v) => set("transport", v as FormState["transport"])} options={TRANSPORTS} />
              <Select label={t("tourEditor.interest")} value={form.interest} onChange={(v) => set("interest", v as FormState["interest"])} options={INTERESTS} />
              <label className="block text-xs font-semibold text-muted-foreground">{t("tourEditor.category")}
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input-base mt-1">
                  <option value="">{t("common.notSet")}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t(`enums.category.${c}` as TKey)}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted-foreground">{t("tourEditor.season")}
                <select value={form.season} onChange={(e) => set("season", e.target.value)} className="input-base mt-1">
                  <option value="">{t("common.notSet")}</option>
                  {SEASONS.map((x) => <option key={x} value={x}>{t(`enums.season.${x}` as TKey)}</option>)}
                </select>
              </label>
            </div>
          </Section>

          <Section title={t("tourEditor.sectionOrganizer")}>
            <div className="grid grid-cols-2 items-end gap-3">
              <Input label={t("tourEditor.organizerName")} value={form.organizer_name} onChange={(v) => set("organizer_name", v)} />
              <Checkbox label={t("tourEditor.organizerVerified")} checked={form.organizer_verified} onChange={(v) => set("organizer_verified", v)} />
            </div>
          </Section>

          <Section title={t("tourEditor.sectionProgram")}>
            <TextArea label={t("tourEditor.highlights")} value={form.highlights} onChange={(v) => set("highlights", v)} rows={3} />
            <TextArea label={t("tourEditor.includes")} value={form.includes} onChange={(v) => set("includes", v)} rows={3} />
            <TextArea label={t("tourEditor.excludes")} value={form.excludes} onChange={(v) => set("excludes", v)} rows={2} />
            <TextArea label={t("tourEditor.whatToBring")} value={form.what_to_bring} onChange={(v) => set("what_to_bring", v)} rows={2} />
            <TextArea label={t("tourEditor.languages")} value={form.languages} onChange={(v) => set("languages", v)} rows={1} />
          </Section>

          <Section title={t("tourEditor.sectionLogistics")}>
            <TextArea label={t("tourEditor.schedule")} value={form.schedule} onChange={(v) => set("schedule", v)} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("tourEditor.groupSize")} value={form.group_size} onChange={(v) => set("group_size", v)} placeholder={t("tourEditor.groupSizePlaceholder")} />
              <Input label={t("tourEditor.startTime")} value={form.start_time} onChange={(v) => set("start_time", v)} placeholder="09:00" />
            </div>
            <Input label={t("tourEditor.meetingPoint")} value={form.meeting_point} onChange={(v) => set("meeting_point", v)} />
          </Section>

          <Section title={t("tourEditor.sectionBookingTerms")}>
            <TextArea label={t("tourEditor.bookingConditions")} value={form.booking_conditions} onChange={(v) => set("booking_conditions", v)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("tourEditor.prepayment")} value={form.prepayment} onChange={(v) => set("prepayment", v)} />
              <Input label={t("tourEditor.cancellationPolicy")} value={form.cancellation_policy} onChange={(v) => set("cancellation_policy", v)} />
            </div>
            <TextArea label={t("tourEditor.groupJoining")} value={form.group_joining_conditions} onChange={(v) => set("group_joining_conditions", v)} rows={2} />
          </Section>

          <Section title={t("tourEditor.sectionShowcase")}>
            <div className="grid grid-cols-2 gap-2">
              <Checkbox label={t("tourEditor.instantConfirmation")} checked={form.is_instant_confirmation} onChange={(v) => set("is_instant_confirmation", v)} />
              <Checkbox label={t("tourEditor.freeCancellation")} checked={form.is_free_cancellation} onChange={(v) => set("is_free_cancellation", v)} />
              <Checkbox label={t("tourEditor.bestseller")} checked={form.is_bestseller} onChange={(v) => set("is_bestseller", v)} />
              <Checkbox label={t("tourEditor.sellingOut")} checked={form.is_likely_to_sell_out} onChange={(v) => set("is_likely_to_sell_out", v)} />
            </div>
          </Section>

          {tour && <DatesPanel tourId={tour.id} />}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal py-3 font-bold text-white disabled:opacity-60"
          >
            {save.isPending && <Loader2 size={16} className="animate-spin" />}
            {t(tour ? "common.save" : "tourEditor.createDraft")}
          </button>
          <button onClick={onClose} className="rounded-2xl bg-secondary px-5 py-3 font-semibold">{t("common.cancel")}</button>
        </div>
      </div>
    </div>
  );
}

function DatesPanel({ tourId }: { tourId: string }) {
  const queryClient = useQueryClient();
  const dates = useQuery({ queryKey: ["admin-tour-dates", tourId], queryFn: () => fetchTourDates(tourId) });
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState("12");
  const t = useT();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-tour-dates", tourId] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
  const onError = (e: unknown) => toast.error(translateError(e, t));

  const add = useMutation({
    mutationFn: () => addTourDate(tourId, { starts_on: newDate, seats_total: Number(newSeats) }),
    onSuccess: () => { invalidate(); setNewDate(""); toast.success(t("tourEditor.dateAdded")); },
    onError,
  });
  const changeSeats = useMutation({
    mutationFn: (vars: { dateId: string; seats: number }) =>
      updateTourDate(tourId, vars.dateId, { seats_total: vars.seats }),
    onSuccess: () => { invalidate(); toast.success(t("tourEditor.capacityChanged")); },
    onError,
  });
  const remove = useMutation({
    mutationFn: (dateId: string) => deleteTourDate(tourId, dateId),
    onSuccess: () => { invalidate(); toast.success(t("tourEditor.dateRemoved")); },
    onError,
  });

  return (
    <Section title={t("tourEditor.sectionDates")}>
      {dates.isLoading ? (
        <Loader2 size={18} className="animate-spin text-teal" />
      ) : (
        <div className="space-y-2">
          {(dates.data ?? []).map((d) => {
            const booked = d.seats_total - d.seats_left;
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/60">
                <div className="flex-1 text-sm font-semibold">{d.starts_on}</div>
                <div className="text-xs text-muted-foreground">{t("units.seatsTaken", { count: booked })}</div>
                <input
                  type="number"
                  defaultValue={d.seats_total}
                  min={1}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== d.seats_total && v >= 1) changeSeats.mutate({ dateId: d.id, seats: v });
                  }}
                  className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-center text-sm outline-none focus:border-teal"
                  title={t("tourEditor.seatsTotal")}
                />
                <button
                  onClick={() => remove.mutate(d.id)}
                  disabled={d.bookings_count > 0}
                  title={t(d.bookings_count > 0 ? "tourEditor.dateHasBookings" : "tourEditor.deleteDate")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 text-coral disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-base flex-1" />
            <input type="number" value={newSeats} min={1} onChange={(e) => setNewSeats(e.target.value)} className="input-base w-20 text-center" title={t("tourEditor.seatsLabel")} />
            <button
              onClick={() => add.mutate()}
              disabled={!newDate || add.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">{label}
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input-base mt-1" />
    </label>
  );
}

function TextArea({ label, value, onChange, rows }: {
  label: string; value: string; onChange: (v: string) => void; rows: number;
}) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">{label}
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="input-base mt-1 resize-y" />
    </label>
  );
}

function Select<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: string) => void; options: readonly { v: T; l: TKey }[];
}) {
  const t = useT();
  return (
    <label className="block text-xs font-semibold text-muted-foreground">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base mt-1">
        {options.map((o) => <option key={o.v} value={o.v}>{t(o.l)}</option>)}
      </select>
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-teal" />
      {label}
    </label>
  );
}

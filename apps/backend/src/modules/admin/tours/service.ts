import { normalizeTourLanguage } from "@yavoy/i18n";
import type {
  AdminTour,
  AdminTourDate,
  AdminTourListQuery,
  CreateTourDatePayload,
  TourWritePayload,
  UpdateTourDatePayload,
  UpdateTourPayload,
} from "@yavoy/contracts";
import type { UserRole } from "@yavoy/contracts";
import type { Db } from "../../../db/client.ts";
import type { tours } from "../../../db/schema.ts";
import { badRequest, conflict, notFound } from "../../../errors.ts";
import { countPartnerTours, getProfileRowById, type PartnerRow } from "../partners/repo.ts";
import { organizerFromProfile, requirePartnerProfile } from "../partners/service.ts";
import {
  cityExists,
  deleteDateRow,
  getAdminDateRow,
  getAdminTourRow,
  insertDate,
  insertTour,
  listAdminDateRows,
  listAdminTourRows,
  updatePriceOverride,
  updateSeatsTotal,
  updateTourRow,
} from "./repo.ts";

type TourRow = typeof tours.$inferSelect;
type TourPatch = Partial<typeof tours.$inferInsert>;

export interface Actor {
  sub: string;
  role: UserRole;
}

/** Партнёр работает только в рамках своего профиля; staff — без ограничений (null) */
async function partnerScope(db: Db, actor: Actor): Promise<PartnerRow | null> {
  return actor.role === "partner" ? requirePartnerProfile(db, actor.sub) : null;
}

/** Чужой тур для партнёра — 404, а не 403: не палим существование */
function assertOwn(scope: PartnerRow | null, row: { tour: TourRow }): void {
  if (scope && row.tour.partnerId !== scope.id) throw notFound("tour_not_found", "Тур не найден");
}

function toAdminTour(row: TourRow, cityName: string): AdminTour {
  return {
    id: row.id,
    status: row.status,
    partner_id: row.partnerId,
    city_id: row.cityId,
    city_name: cityName,
    title: row.title,
    description: row.description,
    image_url: row.imageUrl,
    gallery: row.gallery,
    price_kopeks: row.priceKopeks,
    original_price_kopeks: row.originalPriceKopeks,
    currency: row.currency,
    duration_type: row.durationType,
    duration_text: row.durationText,
    transport: row.transport,
    interest: row.interest,
    category: row.category,
    season: row.season,
    organizer: row.organizer,
    highlights: row.highlights,
    includes: row.includes,
    excludes: row.excludes,
    what_to_bring: row.whatToBring,
    languages: row.languages,
    schedule: row.schedule,
    group_size: row.groupSize,
    meeting_point: row.meetingPoint,
    meeting_lat: row.meetingLat,
    meeting_lng: row.meetingLng,
    start_time: row.startTime,
    booking_conditions: row.bookingConditions,
    prepayment: row.prepayment,
    cancellation_policy: row.cancellationPolicy,
    group_joining_conditions: row.groupJoiningConditions,
    is_instant_confirmation: row.isInstantConfirmation,
    is_free_cancellation: row.isFreeCancellation,
    is_bestseller: row.isBestseller,
    is_likely_to_sell_out: row.isLikelyToSellOut,
    popularity: row.popularity,
    rating: row.rating,
    reviews_count: row.reviewsCount,
    published_at: row.publishedAt.toISOString(),
    created_at: row.createdAt.toISOString(),
  };
}

/** snake_case payload → колонки drizzle; undefined-поля пропускаются (для PATCH) */
function payloadToPatch(p: UpdateTourPayload): TourPatch {
  const patch: TourPatch = {};
  if (p.city_id !== undefined) patch.cityId = p.city_id;
  if (p.title !== undefined) patch.title = p.title;
  if (p.description !== undefined) patch.description = p.description;
  if (p.image_url !== undefined) patch.imageUrl = p.image_url;
  if (p.gallery !== undefined) patch.gallery = p.gallery;
  if (p.price_kopeks !== undefined) patch.priceKopeks = p.price_kopeks;
  if (p.original_price_kopeks !== undefined) patch.originalPriceKopeks = p.original_price_kopeks;
  if (p.currency !== undefined) patch.currency = p.currency;
  if (p.duration_type !== undefined) patch.durationType = p.duration_type;
  if (p.duration_text !== undefined) patch.durationText = p.duration_text;
  if (p.transport !== undefined) patch.transport = p.transport;
  if (p.interest !== undefined) patch.interest = p.interest;
  if (p.category !== undefined) patch.category = p.category;
  if (p.season !== undefined) patch.season = p.season;
  if (p.organizer !== undefined) patch.organizer = p.organizer;
  if (p.highlights !== undefined) patch.highlights = p.highlights;
  if (p.includes !== undefined) patch.includes = p.includes;
  if (p.excludes !== undefined) patch.excludes = p.excludes;
  if (p.what_to_bring !== undefined) patch.whatToBring = p.what_to_bring;
  // языки экскурсии хранятся кодами; свободные строки из старых форм нормализуем на записи (YAV-25)
  if (p.languages !== undefined) patch.languages = p.languages.map(normalizeTourLanguage);
  if (p.schedule !== undefined) patch.schedule = p.schedule;
  if (p.group_size !== undefined) patch.groupSize = p.group_size;
  if (p.meeting_point !== undefined) patch.meetingPoint = p.meeting_point;
  if (p.meeting_lat !== undefined) patch.meetingLat = p.meeting_lat;
  if (p.meeting_lng !== undefined) patch.meetingLng = p.meeting_lng;
  if (p.start_time !== undefined) patch.startTime = p.start_time;
  if (p.booking_conditions !== undefined) patch.bookingConditions = p.booking_conditions;
  if (p.prepayment !== undefined) patch.prepayment = p.prepayment;
  if (p.cancellation_policy !== undefined) patch.cancellationPolicy = p.cancellation_policy;
  if (p.group_joining_conditions !== undefined) patch.groupJoiningConditions = p.group_joining_conditions;
  if (p.is_instant_confirmation !== undefined) patch.isInstantConfirmation = p.is_instant_confirmation;
  if (p.is_free_cancellation !== undefined) patch.isFreeCancellation = p.is_free_cancellation;
  if (p.is_bestseller !== undefined) patch.isBestseller = p.is_bestseller;
  if (p.is_likely_to_sell_out !== undefined) patch.isLikelyToSellOut = p.is_likely_to_sell_out;
  if (p.popularity !== undefined) patch.popularity = p.popularity;
  return patch;
}

export async function listAdminTours(db: Db, actor: Actor, q: AdminTourListQuery): Promise<AdminTour[]> {
  const scope = await partnerScope(db, actor);
  const rows = await listAdminTourRows(db, q, scope?.id);
  return rows.map((r) => toAdminTour(r.tour, r.cityName));
}

export async function getAdminTour(db: Db, actor: Actor, id: string): Promise<AdminTour> {
  const scope = await partnerScope(db, actor);
  const row = await getAdminTourRow(db, id);
  if (!row) throw notFound("tour_not_found", "Тур не найден");
  assertOwn(scope, row);
  return toAdminTour(row.tour, row.cityName);
}

/** Владелец и organizer: партнёру — принудительно свои; staff задаёт partner_id или organizer вручную */
async function resolveOwnership(
  db: Db,
  scope: PartnerRow | null,
  payload: TourWritePayload,
): Promise<{ partnerId: string | null; organizer: TourRow["organizer"] }> {
  if (scope) {
    return {
      partnerId: scope.id,
      organizer: organizerFromProfile(scope, (await countPartnerTours(db, scope.id)) + 1),
    };
  }
  if (payload.partner_id) {
    const row = await getProfileRowById(db, payload.partner_id);
    if (!row) throw badRequest("partner_not_found", "Такого партнёра нет");
    return {
      partnerId: row.profile.id,
      organizer: organizerFromProfile(row.profile, (await countPartnerTours(db, row.profile.id)) + 1),
    };
  }
  if (!payload.organizer) throw badRequest("organizer_required", "Укажите организатора или партнёра");
  return { partnerId: null, organizer: payload.organizer };
}

export async function createTour(db: Db, actor: Actor, payload: TourWritePayload): Promise<AdminTour> {
  const scope = await partnerScope(db, actor);
  if (!(await cityExists(db, payload.city_id))) {
    throw badRequest("city_not_found", "Такого города нет в каталоге");
  }
  const { partnerId, organizer } = await resolveOwnership(db, scope, payload);
  const inserted = await insertTour(db, {
    ...(payloadToPatch(payload) as typeof tours.$inferInsert),
    partnerId,
    organizer,
    status: "draft", // публикация — отдельным осознанным действием
  });
  return getAdminTour(db, actor, inserted.id);
}

export async function updateTour(db: Db, actor: Actor, id: string, payload: UpdateTourPayload): Promise<AdminTour> {
  const scope = await partnerScope(db, actor);
  const existing = await getAdminTourRow(db, id);
  if (!existing) throw notFound("tour_not_found", "Тур не найден");
  assertOwn(scope, existing);

  if (payload.city_id !== undefined && !(await cityExists(db, payload.city_id))) {
    throw badRequest("city_not_found", "Такого города нет в каталоге");
  }

  const patch = payloadToPatch(payload);
  if (scope) {
    // партнёр не распоряжается владельцем и витринным organizer (синхронизируется из профиля),
    // а правка тура снимает его с витрины до ре-публикации менеджером
    delete patch.organizer;
    patch.status = "draft";
  } else if (payload.partner_id !== undefined) {
    if (payload.partner_id) {
      const row = await getProfileRowById(db, payload.partner_id);
      if (!row) throw badRequest("partner_not_found", "Такого партнёра нет");
      patch.partnerId = row.profile.id;
      patch.organizer = organizerFromProfile(row.profile, (await countPartnerTours(db, row.profile.id)) + 1);
    } else {
      patch.partnerId = null;
    }
  }

  if (Object.keys(patch).length === 0) return getAdminTour(db, actor, id);
  await updateTourRow(db, id, patch);
  return getAdminTour(db, actor, id);
}

export async function setTourStatus(db: Db, id: string, status: "draft" | "published"): Promise<AdminTour> {
  // при публикации обновляем published_at — иначе сортировка «новые» будет врать
  const patch: TourPatch = status === "published" ? { status, publishedAt: new Date() } : { status };
  const updated = await updateTourRow(db, id, patch);
  if (!updated) throw notFound("tour_not_found", "Тур не найден");
  const row = await getAdminTourRow(db, id);
  return toAdminTour(row!.tour, row!.cityName);
}

// ─── Даты выездов ────────────────────────────────────────────

type DateRow = { date: { id: string; tourId: string; startsOn: string; seatsTotal: number; seatsLeft: number; priceOverrideKopeks: number | null }; bookingsCount: number };

function toAdminDate(r: DateRow): AdminTourDate {
  return {
    id: r.date.id,
    tour_id: r.date.tourId,
    starts_on: r.date.startsOn,
    seats_total: r.date.seatsTotal,
    seats_left: r.date.seatsLeft,
    price_override_kopeks: r.date.priceOverrideKopeks,
    bookings_count: r.bookingsCount,
  };
}

async function requireTour(db: Db, actor: Actor, tourId: string): Promise<void> {
  const scope = await partnerScope(db, actor);
  const row = await getAdminTourRow(db, tourId);
  if (!row) throw notFound("tour_not_found", "Тур не найден");
  assertOwn(scope, row);
}

export async function listTourDatesAdmin(db: Db, actor: Actor, tourId: string): Promise<AdminTourDate[]> {
  await requireTour(db, actor, tourId);
  const rows = await listAdminDateRows(db, tourId);
  return rows.map(toAdminDate);
}

export async function addTourDate(
  db: Db,
  actor: Actor,
  tourId: string,
  payload: CreateTourDatePayload,
): Promise<AdminTourDate> {
  await requireTour(db, actor, tourId);
  const inserted = await insertDate(db, {
    tourId,
    startsOn: payload.starts_on,
    seatsTotal: payload.seats_total,
    priceOverrideKopeks: payload.price_override_kopeks ?? null,
  });
  if (!inserted) throw conflict("date_exists", "На эту дату выезд уже создан");
  const row = await getAdminDateRow(db, tourId, inserted.id);
  return toAdminDate(row!);
}

export async function updateTourDate(
  db: Db,
  actor: Actor,
  tourId: string,
  dateId: string,
  payload: UpdateTourDatePayload,
): Promise<AdminTourDate> {
  await requireTour(db, actor, tourId);
  const existing = await getAdminDateRow(db, tourId, dateId);
  if (!existing) throw notFound("tour_date_not_found", "Дата выезда не найдена");

  if (payload.seats_total !== undefined && payload.seats_total !== existing.date.seatsTotal) {
    const updated = await updateSeatsTotal(db, tourId, dateId, payload.seats_total);
    if (!updated) {
      throw conflict("seats_total_below_booked", "Забронировано больше мест, чем новая вместимость");
    }
  }
  if (payload.price_override_kopeks !== undefined) {
    await updatePriceOverride(db, tourId, dateId, payload.price_override_kopeks);
  }

  const row = await getAdminDateRow(db, tourId, dateId);
  return toAdminDate(row!);
}

export async function deleteTourDate(db: Db, actor: Actor, tourId: string, dateId: string): Promise<void> {
  await requireTour(db, actor, tourId);
  const existing = await getAdminDateRow(db, tourId, dateId);
  if (!existing) throw notFound("tour_date_not_found", "Дата выезда не найдена");
  const deleted = await deleteDateRow(db, tourId, dateId);
  if (!deleted) {
    throw conflict("tour_date_has_bookings", "На дату есть брони — удалить нельзя");
  }
}

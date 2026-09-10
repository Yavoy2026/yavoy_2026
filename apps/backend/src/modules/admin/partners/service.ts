import { eq } from "drizzle-orm";
import type {
  CreatePartnerPayload,
  Organizer,
  PartnerProfile,
  UpdateMyPartnerProfilePayload,
  UpdatePartnerPayload,
} from "@yavoy/contracts";
import type { PartnerApplication } from "@yavoy/contracts";
import type { Db } from "../../../db/client.ts";
import { closeApplication } from "./applications.ts";
import { partnerProfiles, users } from "../../../db/schema.ts";
import { conflict, forbidden, notFound } from "../../../errors.ts";
import {
  countPartnerTours,
  getProfileByUserId,
  getProfileRowById,
  listProfileRows,
  syncPartnerOrganizer,
  updateProfileRow,
  type DbLike,
  type PartnerRow,
} from "./repo.ts";

type ProfileRowJoined = {
  profile: PartnerRow;
  userEmail: string;
  userFirstName: string;
  userLastName: string | null;
};

function toPartnerProfile(r: ProfileRowJoined): PartnerProfile {
  return {
    id: r.profile.id,
    user_id: r.profile.userId,
    org_name: r.profile.orgName,
    description: r.profile.description,
    phone: r.profile.phone,
    inn: r.profile.inn,
    verified: r.profile.verified,
    created_at: r.profile.createdAt.toISOString(),
    user_email: r.userEmail,
    user_name: [r.userFirstName, r.userLastName].filter(Boolean).join(" "),
  };
}

/** Единственный источник витринного organizer для партнёрских туров */
export function organizerFromProfile(p: PartnerRow, toursCount: number): Organizer {
  return {
    id: p.id,
    name: p.orgName,
    rating: 0,
    review_count: 0,
    avatar: null,
    verified: p.verified,
    tours_count: toursCount,
  };
}

/** Партнёрский профиль актора; роль partner без профиля — конфигурационная ошибка */
export async function requirePartnerProfile(db: DbLike, userId: string): Promise<PartnerRow> {
  const profile = await getProfileByUserId(db, userId);
  if (!profile) throw forbidden("partner_profile_missing", "Профиль организации не создан — обратитесь к администратору");
  return profile;
}

export async function listPartners(db: Db): Promise<PartnerProfile[]> {
  const rows = await listProfileRows(db);
  return rows.map(toPartnerProfile);
}

/** Назначение партнёра: профиль + роль одной транзакцией */
export async function createPartner(db: Db, payload: CreatePartnerPayload): Promise<PartnerProfile> {
  return db.transaction(async (tx) => {
    const userRows = await tx.select().from(users).where(eq(users.id, payload.user_id)).limit(1);
    const user = userRows[0];
    if (!user) throw notFound("user_not_found", "Пользователь не найден");
    if (await getProfileByUserId(tx, payload.user_id)) {
      throw conflict("partner_exists", "У пользователя уже есть профиль организации");
    }

    const inserted = await tx
      .insert(partnerProfiles)
      .values({
        userId: payload.user_id,
        orgName: payload.org_name.trim(),
        description: payload.description ?? "",
        phone: payload.phone ?? "",
        inn: payload.inn ?? "",
      })
      .returning();
    await tx.update(users).set({ role: "partner" }).where(eq(users.id, payload.user_id));

    const row = await getProfileRowById(tx, inserted[0]!.id);
    return toPartnerProfile(row!);
  });
}

async function applyProfilePatch(
  db: Db,
  profileId: string,
  patch: UpdatePartnerPayload,
): Promise<PartnerProfile> {
  return db.transaction(async (tx) => {
    const set: Partial<typeof partnerProfiles.$inferInsert> = {};
    if (patch.org_name !== undefined) set.orgName = patch.org_name.trim();
    if (patch.description !== undefined) set.description = patch.description;
    if (patch.phone !== undefined) set.phone = patch.phone;
    if (patch.inn !== undefined) set.inn = patch.inn;
    if (patch.verified !== undefined) set.verified = patch.verified;

    const updated = Object.keys(set).length
      ? await updateProfileRow(tx, profileId, set)
      : (await getProfileRowById(tx, profileId))?.profile ?? null;
    if (!updated) throw notFound("partner_not_found", "Профиль организации не найден");

    // имя/галочка попадают в витринный organizer каждого тура партнёра
    if (patch.org_name !== undefined || patch.verified !== undefined) {
      const toursCount = await countPartnerTours(tx, profileId);
      await syncPartnerOrganizer(tx, profileId, organizerFromProfile(updated, toursCount));
    }

    const row = await getProfileRowById(tx, profileId);
    return toPartnerProfile(row!);
  });
}

export async function updatePartner(db: Db, id: string, payload: UpdatePartnerPayload): Promise<PartnerProfile> {
  return applyProfilePatch(db, id, payload);
}

export async function getMyPartnerProfile(db: Db, userId: string): Promise<PartnerProfile> {
  const profile = await requirePartnerProfile(db, userId);
  const row = await getProfileRowById(db, profile.id);
  return toPartnerProfile(row!);
}

export async function updateMyPartnerProfile(
  db: Db,
  userId: string,
  payload: UpdateMyPartnerProfilePayload,
): Promise<PartnerProfile> {
  const profile = await requirePartnerProfile(db, userId);
  return applyProfilePatch(db, profile.id, payload);
}

/**
 * Одобрение заявки на партнёрство (YAV-29): профиль организации и роль
 * выдаются данными из самой заявки — менеджер их уже проверил, повторно
 * вводить нечего.
 */
export async function approveApplication(db: Db, reviewerId: string, applicationId: string): Promise<PartnerProfile> {
  const application = await closeApplication(db, applicationId, "approved", reviewerId);
  return createPartner(db, {
    user_id: application.user_id,
    org_name: application.org_name,
    inn: application.inn,
    phone: application.phone,
    description: application.description,
  });
}

/** Отказ с причиной: без неё заявитель не знает, что исправлять */
export async function rejectApplication(
  db: Db,
  reviewerId: string,
  applicationId: string,
  comment: string,
): Promise<PartnerApplication> {
  return closeApplication(db, applicationId, "rejected", reviewerId, comment);
}

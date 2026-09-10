import { desc, eq } from "drizzle-orm";
import type {
  ApplicationStatus,
  PartnerApplication,
  SubmitApplicationPayload,
} from "@yavoy/contracts";
import { partnerOffer } from "@yavoy/legal";
import type { Db } from "../../../db/client.ts";
import { partnerApplications, partnerProfiles, users } from "../../../db/schema.ts";
import { badRequest, conflict, notFound } from "../../../errors.ts";

const view = {
  application: partnerApplications,
  userEmail: users.email,
  userFirstName: users.firstName,
  userLastName: users.lastName,
};

function baseQuery(db: Db) {
  return db.select(view).from(partnerApplications).innerJoin(users, eq(partnerApplications.userId, users.id));
}

type ViewRow = Awaited<ReturnType<ReturnType<typeof baseQuery>["execute"]>>[number];

function toApplication(row: ViewRow): PartnerApplication {
  const a = row.application;
  return {
    id: a.id,
    status: a.status,
    user_id: a.userId,
    user_email: row.userEmail,
    user_name: [row.userFirstName, row.userLastName].filter(Boolean).join(" ").trim(),
    org_name: a.orgName,
    inn: a.inn,
    phone: a.phone,
    description: a.description,
    offer_version: a.offerVersion,
    offer_accepted_at: a.offerAcceptedAt.toISOString(),
    comment: a.comment,
    created_at: a.createdAt.toISOString(),
    reviewed_at: a.reviewedAt?.toISOString() ?? null,
  };
}

/**
 * Подача заявки. Принятая редакция оферты сверяется с действующей: клиент мог
 * держать открытой старую страницу, а согласие с прошлой редакцией нам не
 * подходит — акцепт должен относиться к тому тексту, который сейчас в силе.
 */
export async function submitApplication(
  db: Db,
  userId: string,
  payload: SubmitApplicationPayload,
): Promise<PartnerApplication> {
  if (payload.offer_version !== partnerOffer.version) {
    throw badRequest("offer_version_stale", "Оферта обновилась — перечитайте и отправьте заявку заново");
  }

  const existingProfile = await db
    .select({ id: partnerProfiles.id })
    .from(partnerProfiles)
    .where(eq(partnerProfiles.userId, userId))
    .limit(1);
  if (existingProfile.length > 0) {
    throw conflict("already_partner", "Вы уже партнёр");
  }

  const inserted = await db
    .insert(partnerApplications)
    .values({
      userId,
      orgName: payload.org_name.trim(),
      inn: payload.inn.trim(),
      phone: payload.phone.trim(),
      description: payload.description.trim(),
      offerVersion: payload.offer_version,
    })
    .returning({ id: partnerApplications.id })
    .catch(() => {
      // сработал частичный уникальный индекс: заявка уже на рассмотрении
      throw conflict("application_pending", "Ваша заявка уже на рассмотрении");
    });

  return getApplication(db, inserted[0]!.id);
}

export async function getApplication(db: Db, id: string): Promise<PartnerApplication> {
  const rows = await baseQuery(db).where(eq(partnerApplications.id, id)).limit(1);
  if (!rows[0]) throw notFound("application_not_found", "Заявка не найдена");
  return toApplication(rows[0]);
}

/** Своя последняя заявка: по ней клиент видит статус и причину отказа */
export async function getMyApplication(db: Db, userId: string): Promise<PartnerApplication | null> {
  const rows = await baseQuery(db)
    .where(eq(partnerApplications.userId, userId))
    .orderBy(desc(partnerApplications.createdAt))
    .limit(1);
  return rows[0] ? toApplication(rows[0]) : null;
}

export async function listApplications(db: Db, status: ApplicationStatus): Promise<PartnerApplication[]> {
  const rows = await baseQuery(db)
    .where(eq(partnerApplications.status, status))
    .orderBy(desc(partnerApplications.createdAt));
  return rows.map(toApplication);
}

/** Помечает заявку решением; выдача роли и профиля — на вызывающей стороне */
export async function closeApplication(
  db: Db,
  id: string,
  status: "approved" | "rejected",
  reviewerId: string,
  comment?: string,
): Promise<PartnerApplication> {
  const rows = await db.select().from(partnerApplications).where(eq(partnerApplications.id, id)).limit(1);
  const application = rows[0];
  if (!application) throw notFound("application_not_found", "Заявка не найдена");
  if (application.status !== "pending") {
    throw badRequest("application_not_pending", "Эта заявка уже рассмотрена");
  }
  await db
    .update(partnerApplications)
    .set({ status, comment: comment ?? null, reviewedBy: reviewerId, reviewedAt: new Date() })
    .where(eq(partnerApplications.id, id));
  return getApplication(db, id);
}

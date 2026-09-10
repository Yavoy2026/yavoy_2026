import { and, desc, eq, inArray } from "drizzle-orm";
import type { RevisionStatus, TourRevision, TourRevisionDetail, TourWritePayload } from "@yavoy/contracts";
import type { Db } from "../../../db/client.ts";
import { tourRevisions, tours } from "../../../db/schema.ts";
import { badRequest, conflict, notFound } from "../../../errors.ts";

export type RevisionRow = typeof tourRevisions.$inferSelect;

/** Незакрытая правка тура — черновик или то, что уже ушло на модерацию */
const OPEN: readonly RevisionStatus[] = ["draft", "pending"];

const revisionView = {
  revision: tourRevisions,
  tourTitle: tours.title,
  tourStatus: tours.status,
  organizer: tours.organizer,
};

function baseQuery(db: Db) {
  return db.select(revisionView).from(tourRevisions).innerJoin(tours, eq(tourRevisions.tourId, tours.id));
}

type RevisionViewRow = Awaited<ReturnType<ReturnType<typeof baseQuery>["execute"]>>[number];

function toRevision(row: RevisionViewRow): TourRevision {
  const r = row.revision;
  return {
    id: r.id,
    tour_id: r.tourId,
    tour_title: row.tourTitle,
    tour_status: row.tourStatus,
    organizer_name: row.organizer.name,
    status: r.status,
    comment: r.comment,
    created_at: r.createdAt.toISOString(),
    reviewed_at: r.reviewedAt?.toISOString() ?? null,
  };
}

function toDetail(row: RevisionViewRow): TourRevisionDetail {
  return { ...toRevision(row), payload: row.revision.payload as TourWritePayload };
}

/** Открытая правка тура: одна на тур, это гарантирует частичный уникальный индекс */
export async function getOpenRevision(db: Db, tourId: string): Promise<RevisionRow | null> {
  const rows = await db
    .select()
    .from(tourRevisions)
    .where(and(eq(tourRevisions.tourId, tourId), inArray(tourRevisions.status, [...OPEN])))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Кладёт правку в черновик ревизии. Повторная правка до отправки перезаписывает
 * тот же черновик — партнёр редактирует, пока не решит отправить.
 */
export async function saveDraftRevision(
  db: Db,
  tourId: string,
  userId: string,
  payload: TourWritePayload,
): Promise<RevisionRow> {
  const open = await getOpenRevision(db, tourId);
  if (open?.status === "pending") {
    throw conflict("revision_on_moderation", "Правка уже на модерации — дождитесь решения менеджера");
  }
  if (open) {
    const updated = await db
      .update(tourRevisions)
      .set({ payload, createdBy: userId, createdAt: new Date() })
      .where(eq(tourRevisions.id, open.id))
      .returning();
    return updated[0]!;
  }
  const inserted = await db
    .insert(tourRevisions)
    .values({ tourId, payload, createdBy: userId, status: "draft" })
    .returning();
  return inserted[0]!;
}

/** Отправка на модерацию: снимок фиксируется, автор больше его не меняет */
export async function submitRevision(db: Db, tourId: string, userId: string, payload: TourWritePayload): Promise<TourRevision> {
  const open = await getOpenRevision(db, tourId);
  if (open?.status === "pending") {
    throw conflict("revision_on_moderation", "Правка уже на модерации");
  }
  const id = open
    ? (await db
        .update(tourRevisions)
        .set({ payload, status: "pending", createdBy: userId, createdAt: new Date(), comment: null })
        .where(eq(tourRevisions.id, open.id))
        .returning({ id: tourRevisions.id }))[0]!.id
    : (await db
        .insert(tourRevisions)
        .values({ tourId, payload, createdBy: userId, status: "pending" })
        .returning({ id: tourRevisions.id }))[0]!.id;

  const row = (await baseQuery(db).where(eq(tourRevisions.id, id)).limit(1))[0]!;
  return toRevision(row);
}

/** Очередь модерации: что менеджеру нужно посмотреть */
export async function listRevisions(db: Db, status: RevisionStatus, partnerId?: string): Promise<TourRevision[]> {
  const filter = partnerId
    ? and(eq(tourRevisions.status, status), eq(tours.partnerId, partnerId))
    : eq(tourRevisions.status, status);
  const rows = await baseQuery(db).where(filter).orderBy(desc(tourRevisions.createdAt));
  return rows.map(toRevision);
}

export async function getRevisionDetail(db: Db, id: string, partnerId?: string): Promise<TourRevisionDetail> {
  const rows = await baseQuery(db).where(eq(tourRevisions.id, id)).limit(1);
  const row = rows[0];
  // чужая правка для партнёра — 404, как и чужой тур: не палим существование
  if (!row) throw notFound("revision_not_found", "Правка не найдена");
  const owner = (await db.select({ partnerId: tours.partnerId }).from(tours).where(eq(tours.id, row.revision.tourId)))[0];
  if (partnerId && owner?.partnerId !== partnerId) throw notFound("revision_not_found", "Правка не найдена");
  return toDetail(row);
}

/** Помечает ревизию решением модератора; применение к туру — на вызывающей стороне */
export async function closeRevision(
  db: Db,
  id: string,
  status: "approved" | "rejected",
  reviewerId: string,
  comment?: string,
): Promise<RevisionRow> {
  const rows = await db.select().from(tourRevisions).where(eq(tourRevisions.id, id)).limit(1);
  const revision = rows[0];
  if (!revision) throw notFound("revision_not_found", "Правка не найдена");
  if (revision.status !== "pending") {
    throw badRequest("revision_not_pending", "Эта правка не находится на модерации");
  }
  const updated = await db
    .update(tourRevisions)
    .set({ status, comment: comment ?? null, reviewedBy: reviewerId, reviewedAt: new Date() })
    .where(eq(tourRevisions.id, id))
    .returning();
  return updated[0]!;
}

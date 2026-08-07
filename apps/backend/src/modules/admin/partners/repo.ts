import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "../../../db/client.ts";
import { partnerProfiles, tours, users } from "../../../db/schema.ts";

// Совместим и с Db, и с транзакцией
export type DbLike = Pick<Db, "select" | "insert" | "update" | "delete">;

export type PartnerRow = typeof partnerProfiles.$inferSelect;

export function listProfileRows(db: Db) {
  return db
    .select({ profile: partnerProfiles, userEmail: users.email, userFirstName: users.firstName, userLastName: users.lastName })
    .from(partnerProfiles)
    .innerJoin(users, eq(partnerProfiles.userId, users.id))
    .orderBy(desc(partnerProfiles.createdAt));
}

export async function getProfileRowById(db: DbLike, id: string) {
  const rows = await db
    .select({ profile: partnerProfiles, userEmail: users.email, userFirstName: users.firstName, userLastName: users.lastName })
    .from(partnerProfiles)
    .innerJoin(users, eq(partnerProfiles.userId, users.id))
    .where(eq(partnerProfiles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProfileByUserId(db: DbLike, userId: string): Promise<PartnerRow | null> {
  const rows = await db.select().from(partnerProfiles).where(eq(partnerProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateProfileRow(db: DbLike, id: string, patch: Partial<typeof partnerProfiles.$inferInsert>) {
  const rows = await db.update(partnerProfiles).set(patch).where(eq(partnerProfiles.id, id)).returning();
  return rows[0] ?? null;
}

export async function countPartnerTours(db: DbLike, partnerId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tours)
    .where(eq(tours.partnerId, partnerId));
  return rows[0]?.n ?? 0;
}

/** Синхронизация витринного organizer-jsonb во всех турах партнёра */
export async function syncPartnerOrganizer(
  db: DbLike,
  partnerId: string,
  organizer: typeof tours.$inferSelect.organizer,
): Promise<void> {
  await db.update(tours).set({ organizer }).where(eq(tours.partnerId, partnerId));
}

import type { BookingStatus } from "@yavoy/contracts";
import { conflict } from "../../errors.ts";

/**
 * Машина состояний брони (спека §1.3, правило 1).
 * Любая смена статуса — только через assertTransition.
 *
 * pending_payment → confirmed | cancelled   (оплата прошла / истёк ttl, YAV-21)
 * requested       → confirmed | cancelled   (ручное подтверждение менеджером)
 * confirmed       → completed | cancelled
 * completed, cancelled — терминальные
 */
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw conflict(
      "invalid_booking_transition",
      `Переход брони ${from} → ${to} невозможен`,
    );
  }
}

/** Статусы, в которых бронь удерживает места */
export function holdsSeats(status: BookingStatus): boolean {
  return status === "pending_payment" || status === "requested" || status === "confirmed";
}

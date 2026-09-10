import type { BookingStatus } from "@yavoy/contracts";
import { conflict } from "../../errors.ts";

/**
 * Машина состояний брони (спека §1.3, правило 1; сценарий YAV-28).
 * Любая смена статуса — только через assertTransition.
 *
 *   requested → awaiting_partner → awaiting_payment → confirmed → completed
 *
 * Из каждого живого состояния есть выход в тупик, и тупики разные по смыслу:
 * rejected — организатор отказал, expired — никто не успел вовремя,
 * cancelled — отменил человек. Схлопывать их нельзя: у них разные письма.
 */
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  // Заявка только что создана; обычный следующий шаг — уйти организатору.
  // Решения по ней разрешены и напрямую: в этом статусе лежат брони,
  // созданные до YAV-28, и менеджер должен уметь их закрыть.
  requested: ["awaiting_partner", "awaiting_payment", "confirmed", "rejected", "expired", "cancelled"],
  // ждём, что организатор проверит доступность
  awaiting_partner: ["awaiting_payment", "confirmed", "rejected", "expired", "cancelled"],
  // организатор подтвердил, ждём деньги
  awaiting_payment: ["confirmed", "expired", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  rejected: [],
  expired: [],
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

/**
 * Статусы, в которых бронь удерживает места. Места занимаются с момента
 * заявки и до терминального статуса: иначе организатор подтверждал бы брони,
 * на которые мест уже нет. Плата за это — таймеры протухания, чтобы
 * молчащий организатор не морозил дату навсегда.
 */
const SEAT_HOLDING: readonly BookingStatus[] = [
  "requested",
  "awaiting_partner",
  "awaiting_payment",
  "confirmed",
];

export function holdsSeats(status: BookingStatus): boolean {
  return SEAT_HOLDING.includes(status);
}

/** Терминальные статусы, из которых уже никуда не уйти */
export function isTerminal(status: BookingStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

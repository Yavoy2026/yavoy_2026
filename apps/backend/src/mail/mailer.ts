import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.ts";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(msg: MailMessage): Promise<void>;
}

/**
 * SMTP задаётся через SMTP_URL (smtp://user:pass@host:port).
 * Без него письма уходят в лог — разработка и тесты не требуют почтового аккаунта.
 */
export function createMailer(log: FastifyBaseLogger): Mailer {
  if (!env.SMTP_URL) {
    return {
      async send(msg) {
        log.info({ mail: { to: msg.to, subject: msg.subject } }, "MAIL (SMTP не настроен — только лог)");
      },
    };
  }

  // nodemailer подключается лениво, чтобы не тащить его в тестах без SMTP
  const transportPromise = import("nodemailer").then((m) =>
    m.default.createTransport(env.SMTP_URL),
  );

  return {
    async send(msg) {
      const transport = await transportPromise;
      await transport.sendMail({ from: env.MAIL_FROM ?? "noreply@yavoy.ru", ...msg });
      log.info({ mail: { to: msg.to, subject: msg.subject } }, "MAIL sent");
    },
  };
}

const isEmail = (contact: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());

export function bookingRequestedAdminMail(booking: {
  confirmation_code: string;
  tour_title: string;
  tour_date: string;
  tickets_count: number;
  amount_kopeks: number;
  first_name: string;
  last_name: string;
  contact: string;
}): MailMessage | null {
  if (!env.ADMIN_EMAIL) return null;
  return {
    to: env.ADMIN_EMAIL,
    subject: `Новая заявка ${booking.confirmation_code}: ${booking.tour_title}`,
    text: [
      `Тур: ${booking.tour_title}`,
      `Дата: ${booking.tour_date}`,
      `Билетов: ${booking.tickets_count}`,
      `Сумма: ${(booking.amount_kopeks / 100).toLocaleString("ru-RU")} ₽`,
      `Гость: ${booking.first_name} ${booking.last_name}`,
      `Контакт: ${booking.contact}`,
      ``,
      `Подтвердить: POST /v1/bookings/{id}/confirm (Swagger /docs)`,
    ].join("\n"),
  };
}

export function bookingConfirmedClientMail(booking: {
  contact: string;
  confirmation_code: string;
  tour_title: string;
  tour_date: string;
  start_time: string | null;
  meeting_point: string | null;
  tickets_count: number;
}): MailMessage | null {
  if (!isEmail(booking.contact)) return null; // телефоном займётся менеджер
  return {
    to: booking.contact.trim(),
    subject: `Бронирование подтверждено — ${booking.tour_title}`,
    text: [
      `Ваша бронь подтверждена!`,
      ``,
      `Тур: ${booking.tour_title}`,
      `Дата: ${booking.tour_date}${booking.start_time ? `, ${booking.start_time}` : ""}`,
      booking.meeting_point ? `Место встречи: ${booking.meeting_point}` : "",
      `Билетов: ${booking.tickets_count}`,
      ``,
      `Код подтверждения: ${booking.confirmation_code}`,
      `Покажите его организатору в начале экскурсии.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

import { CATALOGS, createTranslator, formatMoneyMinor } from "@yavoy/i18n";
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
 * Язык писем — один на установку (MAIL_LOCALE), а не по пользователю:
 * переключатель языка живёт в приложении и до сервера не доезжает (решение по YAV-25).
 */
const t = createTranslator(CATALOGS, env.MAIL_LOCALE);
// валюта инсталляции, иначе узбекский ваучер придёт с рублями
const money = (minor: number) => formatMoneyMinor(minor, env.MAIL_LOCALE, env.CURRENCY);

/**
 * SMTP задаётся через SMTP_URL (smtp://user:pass@host:port).
 * Без него письма уходят в лог — разработка и тесты не требуют почтового аккаунта.
 */
export function createMailer(log: FastifyBaseLogger): Mailer {
  if (!env.SMTP_URL) {
    return {
      async send(msg) {
        // text попадает в лог намеренно: на стенде без SMTP это единственный способ увидеть OTP-код
        log.info({ mail: msg }, "MAIL (SMTP не настроен — только лог)");
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

export function otpMail({ to, code }: { to: string; code: string }): MailMessage {
  return {
    to,
    subject: t("mail.otpSubject"),
    text: [t("mail.otpIntro"), "", code, "", t("mail.otpHint")].join("\n"),
  };
}

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
    subject: t("mail.bookingAdminSubject", { code: booking.confirmation_code, tour: booking.tour_title }),
    text: [
      t("mail.bookingAdminTour", { tour: booking.tour_title }),
      t("mail.bookingAdminDate", { date: booking.tour_date }),
      t("mail.bookingAdminTickets", { tickets: booking.tickets_count }),
      t("mail.bookingAdminAmount", { amount: money(booking.amount_kopeks) }),
      t("mail.bookingAdminGuest", { name: `${booking.first_name} ${booking.last_name}` }),
      t("mail.bookingAdminContact", { contact: booking.contact }),
      ``,
      t("mail.bookingAdminAction"),
    ].join("\n"),
  };
}

/**
 * Ваучер клиенту. Кроме кода в нём то, что нужно в дороге: сколько заплачено,
 * с кем связаться и куда идти (YAV-27). Пустые поля выпадают из письма —
 * у туров самой платформы организатора-партнёра нет, координаты есть не у всех.
 */
export function bookingConfirmedClientMail(booking: {
  contact: string;
  confirmation_code: string;
  tour_title: string;
  tour_date: string;
  start_time: string | null;
  meeting_point: string | null;
  meeting_map_url: string | null;
  tickets_count: number;
  amount_kopeks: number;
  organizer_name: string;
  organizer_phone: string | null;
}): MailMessage | null {
  if (!isEmail(booking.contact)) return null; // телефоном займётся менеджер
  return {
    to: booking.contact.trim(),
    subject: t("mail.bookingConfirmedSubject", { tour: booking.tour_title }),
    text: [
      t("mail.bookingConfirmedIntro"),
      ``,
      t("mail.bookingConfirmedTour", { tour: booking.tour_title }),
      t("mail.bookingConfirmedDate", {
        date: booking.start_time ? `${booking.tour_date}, ${booking.start_time}` : booking.tour_date,
      }),
      booking.meeting_point ? t("mail.bookingConfirmedMeeting", { point: booking.meeting_point }) : "",
      booking.meeting_map_url ? t("mail.bookingConfirmedMap", { url: booking.meeting_map_url }) : "",
      t("mail.bookingConfirmedTickets", { tickets: booking.tickets_count }),
      t("mail.bookingConfirmedAmount", { amount: money(booking.amount_kopeks) }),
      ``,
      t("mail.bookingConfirmedOrganizer", { organizer: booking.organizer_name }),
      booking.organizer_phone ? t("mail.bookingConfirmedPhone", { phone: booking.organizer_phone }) : "",
      ``,
      t("mail.bookingConfirmedCode", { code: booking.confirmation_code }),
      t("mail.bookingConfirmedHint"),
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

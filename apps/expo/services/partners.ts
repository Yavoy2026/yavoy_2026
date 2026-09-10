import { partnerOffer } from "@yavoy/legal";

import { ApiError, authFetch } from "@/services/api";

/** Заявка на партнёрство (YAV-24); зеркалит веб-сервис */
export interface PartnerApplication {
  id: string;
  status: "pending" | "approved" | "rejected";
  org_name: string;
  inn: string;
  phone: string;
  description: string;
  comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ApplicationForm {
  org_name: string;
  inn: string;
  phone: string;
  description: string;
}

async function parse<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? fallback, body?.error?.message ?? fallback);
  }
  return res.json() as Promise<T>;
}

/**
 * Подача заявки. Версию оферты подставляем здесь: акцепт относится к документу,
 * а не к экрану, и забыть её из формы было бы легко.
 */
export async function submitApplication(form: ApplicationForm): Promise<PartnerApplication> {
  const res = await authFetch("/partner-applications", {
    method: "POST",
    body: JSON.stringify({ ...form, offer_version: partnerOffer.version }),
  });
  return parse<PartnerApplication>(res, "applicationSubmitFailed");
}

/** Своя последняя заявка: статус и причина отказа. null — заявок не было */
export async function fetchMyApplication(): Promise<PartnerApplication | null> {
  const res = await authFetch("/partner-applications/me");
  if (!res.ok) throw new ApiError(res.status, "applicationLoadFailed", "applicationLoadFailed");
  return (await res.json()) as PartnerApplication | null;
}

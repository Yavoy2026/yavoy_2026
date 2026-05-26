import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import {
  PartnerProfile,
  PartnerEntityType,
  PartnerTourSubmission,
  PartnerGuest,
  PartnerTransaction,
  PartnerChatMessage,
  PartnerReview,
  PartnerReviewReply,
} from "@/types/tour";

const initialTours: PartnerTourSubmission[] = [
  {
    id: "psub1",
    title: "Гастротур по Кавказским Минеральным Водам",
    description: "Дегустации, локальные сыры и виноделие региона.",
    city: "Кисловодск",
    price: 8500,
    currency: "₽",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    duration: "one_day",
    transport: "auto",
    interest: "city",
    category: "gastro",
    season: "all_year",
    groupSize: "до 12 человек",
    meetingPoint: "Кисловодск, Курортный бульвар, 1",
    status: "published",
    submittedAt: "2026-04-12",
    partnerInn: "7707123456",
  },
  {
    id: "psub2",
    title: "Восхождение на Бештау",
    description: "Маршрут средней сложности с гидом и фотосессией на вершине.",
    city: "Пятигорск",
    price: 4200,
    currency: "₽",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
    duration: "one_day",
    transport: "auto",
    interest: "nature",
    category: "photo",
    season: "summer",
    groupSize: "до 15 человек",
    meetingPoint: "Пятигорск, ж/д вокзал",
    status: "pending",
    submittedAt: "2026-05-18",
    partnerInn: "7707123456",
  },
];

const initialGuests: PartnerGuest[] = [
  { id: "pg1", tourId: "psub1", firstName: "Анна", lastName: "Соколова", phone: "+7 (903) 222-08-91", tourDate: "2026-04-20", ticketCount: 2, status: "completed" },
  { id: "pg2", tourId: "psub1", firstName: "Дмитрий", lastName: "Кузнецов", phone: "+7 (911) 401-77-12", tourDate: "2026-05-04", ticketCount: 3, status: "completed" },
  { id: "pg3", tourId: "psub1", firstName: "Мария", lastName: "Орлова", phone: "+7 (929) 678-34-09", tourDate: "2026-06-12", ticketCount: 4, status: "upcoming" },
  { id: "pg4", tourId: "psub2", firstName: "Сергей", lastName: "Васильев", phone: "+7 (905) 999-12-77", tourDate: "2026-06-22", ticketCount: 2, status: "upcoming" },
];

const initialTransactions: PartnerTransaction[] = [
  { id: "ptr1", tourId: "psub1", tourTitle: "Гастротур по КМВ", amount: 17000, currency: "₽", date: "2026-04-20", guestName: "Анна Соколова", status: "completed" },
  { id: "ptr2", tourId: "psub1", tourTitle: "Гастротур по КМВ", amount: 25500, currency: "₽", date: "2026-05-04", guestName: "Дмитрий Кузнецов", status: "completed" },
  { id: "ptr3", tourId: "psub1", tourTitle: "Гастротур по КМВ", amount: 34000, currency: "₽", date: "2026-05-20", guestName: "Мария Орлова", status: "pending" },
  { id: "ptr4", tourId: "psub2", tourTitle: "Восхождение на Бештау", amount: 8400, currency: "₽", date: "2026-05-22", guestName: "Сергей Васильев", status: "pending" },
  { id: "ptr5", tourId: "psub1", tourTitle: "Гастротур по КМВ", amount: 8500, currency: "₽", date: "2026-03-12", guestName: "Игорь Лебедев", status: "completed" },
  { id: "ptr6", tourId: "psub1", tourTitle: "Гастротур по КМВ", amount: 17000, currency: "₽", date: "2025-12-10", guestName: "Наталья Котова", status: "completed" },
];

const initialChat: PartnerChatMessage[] = [
  { id: "pcm1", tourId: "psub1", authorType: "client", authorName: "Анна Соколова", content: "Здравствуйте! А во сколько собираемся в субботу?", createdAt: "2026-04-18 14:21" },
  { id: "pcm2", tourId: "psub1", authorType: "partner", authorName: "Партнёр", content: "Добрый день! Сбор в 9:00 на Курортном бульваре, у фонтана.", createdAt: "2026-04-18 14:32" },
  { id: "pcm3", tourId: "psub1", authorType: "admin", authorName: "Администратор YAVOY", content: "Подключился к диалогу для контроля качества. Всё на связи.", createdAt: "2026-04-18 14:33" },
];

const initialReviews: PartnerReview[] = [
  {
    id: "prev1",
    tourId: "psub1",
    partnerInn: "7707123456",
    author: "Анна Соколова",
    rating: 5,
    text: "Восхитительная экскурсия! Гид — настоящий профессионал, сыры — пальчики оближешь. Спасибо!",
    createdAt: "2026-04-21",
    reply: {
      id: "prep1",
      reviewId: "prev1",
      partnerInn: "7707123456",
      content: "Анна, спасибо большое! Ждём вас снова — летом запустим виноградные дегустации.",
      status: "approved",
      createdAt: "2026-04-22",
      moderatedAt: "2026-04-22",
    },
  },
  {
    id: "prev2",
    tourId: "psub1",
    partnerInn: "7707123456",
    author: "Дмитрий Кузнецов",
    rating: 4,
    text: "Очень понравилось, но хотелось бы чуть больше времени на дегустации.",
    createdAt: "2026-05-05",
  },
  {
    id: "prev3",
    tourId: "psub2",
    partnerInn: "7707123456",
    author: "Игорь Лебедев",
    rating: 5,
    text: "Сложный, но безумно красивый маршрут. Виды с вершины — космос!",
    createdAt: "2026-03-15",
  },
];

async function checkFnsRegistry(value: string): Promise<{
  ok: boolean;
  data?: { legalName: string; ceo?: string; address: string; entityType: PartnerEntityType; taxRegistrationDate: string; ogrn?: string; inn: string };
  error?: string;
}> {
  await new Promise((r) => setTimeout(r, 1200));
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10 && digits.length !== 12 && digits.length !== 13 && digits.length !== 15) {
    return { ok: false, error: "Неверный формат. Введите ИНН (10/12 цифр) или ОГРН (13/15 цифр)." };
  }
  const isOgrn = digits.length === 13 || digits.length === 15;
  const entityType: PartnerEntityType = digits.length === 10 || digits.length === 13 ? "company" : digits.length === 12 ? "ip" : "self_employed";
  const labels: Record<PartnerEntityType, string> = {
    company: "ООО «Тревел Партнёр»",
    ip: "ИП Иванов Иван Иванович",
    self_employed: "Самозанятый Петров П. П.",
  };
  return {
    ok: true,
    data: {
      legalName: labels[entityType],
      ceo: entityType === "company" ? "Иванов И. И." : undefined,
      address: "Россия, г. Москва, ул. Тверская, 1",
      entityType,
      taxRegistrationDate: "2022-03-15",
      ogrn: isOgrn ? digits : undefined,
      inn: isOgrn ? digits.slice(0, 10) : digits,
    },
  };
}

export const [PartnersProvider, usePartners] = createContextHook(() => {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [tours, setTours] = useState<PartnerTourSubmission[]>(initialTours);
  const [guests] = useState<PartnerGuest[]>(initialGuests);
  const [transactions] = useState<PartnerTransaction[]>(initialTransactions);
  const [chat, setChat] = useState<PartnerChatMessage[]>(initialChat);
  const [reviews, setReviews] = useState<PartnerReview[]>(initialReviews);
  const [verifying, setVerifying] = useState<boolean>(false);

  const verifyAndRegister = useCallback(async (value: string): Promise<{ ok: boolean; error?: string }> => {
    setVerifying(true);
    try {
      const res = await checkFnsRegistry(value);
      if (!res.ok || !res.data) {
        return { ok: false, error: res.error ?? "Не удалось получить данные из ФНС" };
      }
      const p: PartnerProfile = {
        inn: res.data.inn,
        ogrn: res.data.ogrn,
        entityType: res.data.entityType,
        legalName: res.data.legalName,
        ceo: res.data.ceo,
        address: res.data.address,
        registeredAt: new Date().toISOString().slice(0, 10),
        verifiedByFns: true,
        taxRegistrationDate: res.data.taxRegistrationDate,
      };
      setProfile(p);
      console.log("[PartnersProvider] Registered", p.inn);
      return { ok: true };
    } catch (e) {
      console.log("[PartnersProvider] verify error", e);
      return { ok: false, error: "Ошибка соединения с ФНС. Попробуйте позже." };
    } finally {
      setVerifying(false);
    }
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
  }, []);

  const submitTour = useCallback(
    (
      data: Omit<PartnerTourSubmission, "id" | "status" | "submittedAt" | "partnerInn">,
    ) => {
      const newTour: PartnerTourSubmission = {
        ...data,
        id: `psub-${Date.now()}`,
        status: "pending",
        submittedAt: new Date().toISOString().slice(0, 10),
        partnerInn: profile?.inn ?? "",
      };
      setTours((prev) => [newTour, ...prev]);
      return newTour;
    },
    [profile],
  );

  const sendChatMessage = useCallback((tourId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const partnerMsg: PartnerChatMessage = {
      id: `pcm-${Date.now()}`,
      tourId,
      authorType: "partner",
      authorName: "Вы (партнёр)",
      content: trimmed,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setChat((prev) => [...prev, partnerMsg]);
  }, []);

  const submitReviewReply = useCallback((reviewId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const inn = profile?.inn ?? "";
    const reply: PartnerReviewReply = {
      id: `prep-${Date.now()}`,
      reviewId,
      partnerInn: inn,
      content: trimmed,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)));
    console.log("[PartnersProvider] Reply submitted for moderation", reviewId);
  }, [profile]);

  const approveReply = useCallback((reviewId: string) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId && r.reply ? { ...r, reply: { ...r.reply, status: "approved" as const, moderatedAt: new Date().toISOString().slice(0, 10) } } : r)));
  }, []);

  const rejectReply = useCallback((reviewId: string, reason?: string) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId && r.reply ? { ...r, reply: { ...r.reply, status: "rejected" as const, moderatedAt: new Date().toISOString().slice(0, 10), rejectionReason: reason } } : r)));
  }, []);

  const ownerReviews = useMemo(() => {
    const inn = profile?.inn ?? "";
    return reviews.filter((r) => r.partnerInn === inn);
  }, [reviews, profile]);

  const partnerRating = useMemo(() => {
    if (ownerReviews.length === 0) return { average: 0, count: 0 };
    const sum = ownerReviews.reduce((s, r) => s + r.rating, 0);
    return { average: Math.round((sum / ownerReviews.length) * 10) / 10, count: ownerReviews.length };
  }, [ownerReviews]);

  const pendingReplies = useMemo(() => reviews.filter((r) => r.reply && r.reply.status === "pending"), [reviews]);

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const halfYearAgo = Date.now() - 182 * 24 * 60 * 60 * 1000;
    const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const sumIn = (since: number) =>
      completed.filter((t) => new Date(t.date).getTime() >= since).reduce((s, t) => s + t.amount, 0);
    return {
      week: sumIn(weekAgo),
      month: sumIn(monthAgo),
      halfYear: sumIn(halfYearAgo),
      year: sumIn(yearAgo),
      all: completed.reduce((s, t) => s + t.amount, 0),
      published: tours.filter((t) => t.status === "published").length,
      pending: tours.filter((t) => t.status === "pending").length,
    };
  }, [transactions, tours]);

  return useMemo(
    () => ({
      profile,
      isRegistered: profile !== null,
      verifying,
      verifyAndRegister,
      logout,
      tours,
      submitTour,
      guests,
      transactions,
      chat,
      sendChatMessage,
      reviews: ownerReviews,
      allReviews: reviews,
      partnerRating,
      submitReviewReply,
      approveReply,
      rejectReply,
      pendingReplies,
      stats,
    }),
    [profile, verifying, verifyAndRegister, logout, tours, submitTour, guests, transactions, chat, sendChatMessage, ownerReviews, reviews, partnerRating, submitReviewReply, approveReply, rejectReply, pendingReplies, stats],
  );
});

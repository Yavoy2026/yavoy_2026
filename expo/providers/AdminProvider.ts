import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { AdminUser, PartnerTour, AdminChatMessage, UserRole } from "@/types/tour";

const initialUsers: AdminUser[] = [
  { id: "u1", firstName: "Иван", lastName: "Петров", phone: "+7 (916) 555-12-34", email: "ivan.petrov@email.com", registeredAt: "2025-08-14", city: "Москва", purchasedToursCount: 6, role: "user" },
  { id: "u2", firstName: "Анна", lastName: "Соколова", phone: "+7 (903) 222-08-91", email: "anna.sokolova@mail.ru", registeredAt: "2025-09-02", city: "Санкт-Петербург", purchasedToursCount: 11, role: "user" },
  { id: "u3", firstName: "Дмитрий", lastName: "Кузнецов", phone: "+7 (911) 401-77-12", email: "kuznetsov.dm@gmail.com", registeredAt: "2025-10-19", city: "Казань", purchasedToursCount: 2, role: "manager" },
  { id: "u4", firstName: "Мария", lastName: "Орлова", phone: "+7 (929) 678-34-09", email: "m.orlova@yandex.ru", registeredAt: "2026-01-08", city: "Сочи", purchasedToursCount: 4, role: "user" },
  { id: "u5", firstName: "Сергей", lastName: "Васильев", phone: "+7 (905) 999-12-77", email: "s.vasiliev@email.com", registeredAt: "2026-02-23", city: "Кисловодск", purchasedToursCount: 0, role: "user" },
  { id: "u6", firstName: "Екатерина", lastName: "Новикова", phone: "+7 (925) 612-88-04", email: "e.novikova@gmail.com", registeredAt: "2026-03-30", city: "Иркутск", purchasedToursCount: 3, role: "user" },
  { id: "u7", firstName: "Артём", lastName: "Громов", phone: "+7 (962) 444-12-09", email: "gromov@email.com", registeredAt: "2026-04-12", city: "Новороссийск", purchasedToursCount: 1, role: "user" },
];

const initialPartnerTours: PartnerTour[] = [
  { id: "pt1", title: "Гастротур по Кавказским Минеральным Водам", partner: "Кавказ Travel", city: "Кисловодск", price: 8500, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", status: "pending", submittedAt: "2026-05-10" },
  { id: "pt2", title: "Мистический ночной Петербург", partner: "Северная Звезда", city: "Санкт-Петербург", price: 2400, image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=600&h=400&fit=crop", status: "pending", submittedAt: "2026-05-12" },
  { id: "pt3", title: "Фототур к Куршской косе", partner: "Балтика Лайф", city: "Калининград", price: 6900, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop", status: "pending", submittedAt: "2026-05-13" },
];

const initialUserChats: AdminChatMessage[] = [
  { id: "uc1", authorId: "u1", authorName: "Иван Петров", authorType: "user", content: "Здравствуйте! Нужна помощь с возвратом средств за тур.", createdAt: "2026-05-13 10:14" },
  { id: "uc2", authorId: "admin", authorName: "Администратор", authorType: "admin", content: "Здравствуйте, Иван. Уточните номер бронирования, разберёмся в течение часа.", createdAt: "2026-05-13 10:22" },
  { id: "uc3", authorId: "u2", authorName: "Анна Соколова", authorType: "user", content: "Можно ли перенести экскурсию на другой день?", createdAt: "2026-05-13 12:01" },
];

const initialPartnerChats: AdminChatMessage[] = [
  { id: "pc1", authorId: "p1", authorName: "Кавказ Travel", authorType: "partner", content: "Загрузили новый гастротур, посмотрите, пожалуйста, на модерацию.", createdAt: "2026-05-13 09:40" },
  { id: "pc2", authorId: "admin", authorName: "Администратор", authorType: "admin", content: "Принято, проверим сегодня и сообщим о публикации.", createdAt: "2026-05-13 09:52" },
  { id: "pc3", authorId: "p2", authorName: "Северная Звезда", authorType: "partner", content: "Добавили описания и фото к мистическому туру, ждём публикации.", createdAt: "2026-05-13 11:28" },
];

const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "Lotofond";

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [partnerTours, setPartnerTours] = useState<PartnerTour[]>(initialPartnerTours);
  const [userChats, setUserChats] = useState<AdminChatMessage[]>(initialUserChats);
  const [partnerChats, setPartnerChats] = useState<AdminChatMessage[]>(initialPartnerChats);

  const login = useCallback((username: string, password: string): boolean => {
    const ok = username.trim().toLowerCase() === ADMIN_LOGIN && password === ADMIN_PASSWORD;
    if (ok) {
      setIsAuthenticated(true);
      console.log("[AdminProvider] Login success");
    } else {
      console.log("[AdminProvider] Login failed");
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const setUserRole = useCallback((userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    console.log("[AdminProvider] Role set", userId, role);
  }, []);

  const approvePartnerTour = useCallback((id: string) => {
    setPartnerTours((prev) => prev.map((t) => (t.id === id ? { ...t, status: "published" as const } : t)));
  }, []);

  const rejectPartnerTour = useCallback((id: string) => {
    setPartnerTours((prev) => prev.map((t) => (t.id === id ? { ...t, status: "rejected" as const } : t)));
  }, []);

  const sendUserChatMessage = useCallback((content: string) => {
    const msg: AdminChatMessage = {
      id: `uc-${Date.now()}`,
      authorId: "admin",
      authorName: "Администратор",
      authorType: "admin",
      content,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setUserChats((prev) => [...prev, msg]);
  }, []);

  const sendPartnerChatMessage = useCallback((content: string) => {
    const msg: AdminChatMessage = {
      id: `pc-${Date.now()}`,
      authorId: "admin",
      authorName: "Администратор",
      authorType: "admin",
      content,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setPartnerChats((prev) => [...prev, msg]);
  }, []);

  const stats = useMemo(() => {
    const totalPurchased = users.reduce((sum, u) => sum + u.purchasedToursCount, 0);
    const managers = users.filter((u) => u.role === "manager").length;
    return {
      totalUsers: users.length,
      totalPurchased,
      managers,
      pendingPartnerTours: partnerTours.filter((t) => t.status === "pending").length,
    };
  }, [users, partnerTours]);

  return useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      users,
      setUserRole,
      partnerTours,
      approvePartnerTour,
      rejectPartnerTour,
      userChats,
      partnerChats,
      sendUserChatMessage,
      sendPartnerChatMessage,
      stats,
    }),
    [isAuthenticated, login, logout, users, setUserRole, partnerTours, approvePartnerTour, rejectPartnerTour, userChats, partnerChats, sendUserChatMessage, sendPartnerChatMessage, stats]
  );
});

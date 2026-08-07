import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  Map as MapIcon,
  MessageSquare,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Users as UsersIcon,
  X,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCatalog } from "@/services/catalog";
import type { ThemeColors } from "@/constants/colors";
import type { UserProfile, UserRole } from "@/services/api";
import * as bo from "@/services/backoffice";
import { TourEditorModal } from "@/components/backoffice/TourEditorModal";

type Tab = "bookings" | "reviews" | "users" | "tours" | "partners" | "org";

const showError = (msg: string) => Alert.alert("Ошибка", msg);
const errText = (e: unknown) => (e instanceof Error ? e.message : "Ошибка");

export default function BackofficeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const isPartner = auth.role === "partner";
  const isStaff = auth.role === "admin" || auth.role === "manager";
  const isAdmin = auth.role === "admin";
  const hasAccess = isPartner || isStaff;

  const [tab, setTab] = useState<Tab>("bookings");
  useEffect(() => {
    if (isPartner && !["tours", "org"].includes(tab)) setTab("tours");
  }, [isPartner, tab]);

  const screenOptions = {
    title: isPartner ? "Кабинет партнёра" : "Бэкофис",
    headerStyle: { backgroundColor: colors.headerBg },
    headerTintColor: "#FFFFFF",
  };

  // сессия ещё проверяется — не мигать отказом в доступе
  if (auth.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <ShieldCheck size={44} color={colors.textMuted} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Доступ запрещён</Text>
        <Text style={[styles.deniedText, { color: colors.textMuted }]}>
          Бэкофис доступен партнёрам, менеджерам и администраторам.
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.teal }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: { k: Tab; l: string; icon: React.ComponentType<{ size: number; color: string }> }[] = isPartner
    ? [
        { k: "tours", l: "Мои туры", icon: MapIcon },
        { k: "org", l: "Организация", icon: Building2 },
      ]
    : [
        { k: "bookings", l: "Брони", icon: ClipboardList },
        { k: "reviews", l: "Отзывы", icon: MessageSquare },
        { k: "users", l: "Пользователи", icon: UsersIcon },
        { k: "tours", l: "Туры", icon: MapIcon },
        { k: "partners", l: "Партнёры", icon: Building2 },
      ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={screenOptions} />

      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <TouchableOpacity
                key={t.k}
                onPress={() => setTab(t.k)}
                style={[styles.tabChip, { backgroundColor: active ? colors.teal : colors.surface, borderColor: colors.border }]}
              >
                <t.icon size={14} color={active ? "#FFF" : colors.textMuted} />
                <Text style={[styles.tabChipText, { color: active ? "#FFF" : colors.text }]}>{t.l}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {tab === "bookings" && isStaff && <BookingsTab colors={colors} />}
      {tab === "reviews" && isStaff && <ReviewsTab colors={colors} />}
      {tab === "users" && isStaff && <UsersTab colors={colors} isAdmin={isAdmin} myId={auth.user?.id} />}
      {tab === "tours" && <ToursTab colors={colors} isPartner={isPartner} isStaff={isStaff} />}
      {tab === "partners" && isStaff && <PartnersTab colors={colors} isAdmin={isAdmin} />}
      {tab === "org" && isPartner && <OrgTab colors={colors} />}
    </View>
  );
}

// ─── Брони ───────────────────────────────────────────────────

function BookingsTab({ colors }: { colors: ThemeColors }) {
  const queryClient = useQueryClient();
  const requested = useQuery({ queryKey: ["bo-bookings", "requested"], queryFn: () => bo.fetchBackofficeBookings("requested") });
  const confirmed = useQuery({ queryKey: ["bo-bookings", "confirmed"], queryFn: () => bo.fetchBackofficeBookings("confirmed") });

  const action = useMutation({
    mutationFn: (vars: { id: string; action: "confirm" | "complete" | "cancel" }) =>
      vars.action === "confirm" ? bo.confirmBooking(vars.id) : vars.action === "complete" ? bo.completeBooking(vars.id) : bo.cancelBookingAdmin(vars.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["bo-bookings"] }),
    onError: (e: unknown) => showError(errText(e)),
  });

  const refreshing = requested.isRefetching || confirmed.isRefetching;
  const refresh = () => {
    void requested.refetch();
    void confirmed.refetch();
  };

  if (requested.isLoading || confirmed.isLoading) return <Loading colors={colors} />;

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />}
    >
      <Text style={[styles.groupTitle, { color: colors.text }]}>Новые заявки</Text>
      {(requested.data ?? []).length === 0 && <Empty colors={colors} text="Нет заявок, ожидающих подтверждения" />}
      {(requested.data ?? []).map((b) => (
        <Card key={b.id} colors={colors}>
          <View style={styles.cardRow}>
            <Image source={{ uri: b.tourImage }} style={styles.thumb} contentFit="cover" />
            <View style={styles.flex1}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{b.tourTitle}</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                {b.tourDate} · {b.tickets} чел. · {b.amountRub.toLocaleString("ru-RU")}₽ · {b.code}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{b.guest} · {b.contact}</Text>
            </View>
            <IconBtn colors={colors} bg={colors.mint + "22"} onPress={() => action.mutate({ id: b.id, action: "confirm" })}>
              <Check size={17} color={colors.mint} />
            </IconBtn>
            <IconBtn colors={colors} bg={colors.red + "22"} onPress={() => action.mutate({ id: b.id, action: "cancel" })}>
              <X size={17} color={colors.red} />
            </IconBtn>
          </View>
        </Card>
      ))}

      <Text style={[styles.groupTitle, { color: colors.text, marginTop: 14 }]}>Подтверждённые</Text>
      {(confirmed.data ?? []).length === 0 && <Empty colors={colors} text="Нет подтверждённых броней" />}
      {(confirmed.data ?? []).map((b) => (
        <Card key={b.id} colors={colors}>
          <View style={styles.cardRow}>
            <Image source={{ uri: b.tourImage }} style={styles.thumb} contentFit="cover" />
            <View style={styles.flex1}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{b.tourTitle}</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{b.tourDate} · {b.guest} · {b.code}</Text>
            </View>
            <SmallBtn colors={colors} label="Завершить" onPress={() => action.mutate({ id: b.id, action: "complete" })} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── Отзывы ──────────────────────────────────────────────────

function ReviewsTab({ colors }: { colors: ThemeColors }) {
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: ["bo-reviews"], queryFn: bo.fetchPendingReviews });

  const action = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => (vars.approve ? bo.approveReview(vars.id) : bo.rejectReview(vars.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bo-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e: unknown) => showError(errText(e)),
  });

  if (reviews.isLoading) return <Loading colors={colors} />;

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={reviews.isRefetching} onRefresh={() => void reviews.refetch()} tintColor={colors.teal} />}
    >
      {(reviews.data ?? []).length === 0 && <Empty colors={colors} text="Нет отзывов на модерации" />}
      {(reviews.data ?? []).map((r) => (
        <Card key={r.id} colors={colors}>
          <View style={styles.cardRow}>
            <Image source={{ uri: r.tourImage }} style={styles.thumbSm} contentFit="cover" />
            <Text style={[styles.cardTitle, styles.flex1, { color: colors.text }]} numberOfLines={1}>{r.tourTitle}</Text>
            <View style={styles.ratingRow}>
              <Star size={13} color={colors.gold} fill={colors.gold} />
              <Text style={[styles.ratingText, { color: colors.gold }]}>{r.rating}</Text>
            </View>
          </View>
          <Text style={[styles.reviewText, { color: colors.text, backgroundColor: colors.inputBg }]}>
            {r.authorName}: {r.text}
          </Text>
          <View style={styles.actionsRow}>
            <IconBtn colors={colors} bg={colors.mint + "22"} onPress={() => action.mutate({ id: r.id, approve: true })}>
              <Check size={17} color={colors.mint} />
            </IconBtn>
            <IconBtn colors={colors} bg={colors.red + "22"} onPress={() => action.mutate({ id: r.id, approve: false })}>
              <X size={17} color={colors.red} />
            </IconBtn>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── Пользователи ────────────────────────────────────────────

const ROLE_LABELS: { v: UserRole; l: string }[] = [
  { v: "user", l: "Пользователь" },
  { v: "partner", l: "Партнёр" },
  { v: "manager", l: "Менеджер" },
  { v: "admin", l: "Админ" },
];

function UsersTab({ colors, isAdmin, myId }: { colors: ThemeColors; isAdmin: boolean; myId?: string }) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({ queryKey: ["bo-users", q], queryFn: () => bo.listUsers(q || undefined) });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["bo-users"] });
  const roleAction = useMutation({
    mutationFn: (vars: { id: string; role: UserRole }) => bo.updateUserRole(vars.id, vars.role),
    onSuccess: invalidate,
    onError: (e: unknown) => showError(errText(e)),
  });
  const activeAction = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => bo.setUserActive(vars.id, vars.active),
    onSuccess: invalidate,
    onError: (e: unknown) => showError(errText(e)),
  });

  const pickRole = (u: UserProfile) => {
    if (!isAdmin) {
      showError("Роли меняет только админ");
      return;
    }
    Alert.alert(
      "Роль пользователя",
      u.email,
      [
        ...ROLE_LABELS.filter((r) => r.v !== "partner").map((r) => ({
          text: r.l + (u.role === r.v ? " ✓" : ""),
          onPress: () => {
            if (u.role !== r.v) roleAction.mutate({ id: u.id, role: r.v });
          },
        })),
        { text: "Отмена", style: "cancel" as const },
      ],
    );
  };

  if (users.isLoading) return <Loading colors={colors} />;

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={users.isRefetching} onRefresh={() => void users.refetch()} tintColor={colors.teal} />}
    >
      <TextInput
        style={[styles.search, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по email или имени"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Роль «Партнёр» назначается на вкладке «Партнёры» (вместе с профилем организации).
      </Text>
      {(users.data ?? []).map((u) => {
        const self = u.id === myId;
        const roleLabel = ROLE_LABELS.find((r) => r.v === u.role)?.l ?? u.role;
        return (
          <Card key={u.id} colors={colors}>
            <View style={styles.cardRow}>
              <View style={[styles.avatar, { backgroundColor: colors.teal + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.teal }]}>
                  {(u.first_name?.[0] ?? u.email[0] ?? "?").toUpperCase()}
                </Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {u.first_name || u.email.split("@")[0]}{u.last_name ? ` ${u.last_name}` : ""}
                  {!u.is_active ? "  ·  деактивирован" : ""}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>{u.email}</Text>
              </View>
              <SmallBtn colors={colors} label={roleLabel} muted disabled={self} onPress={() => pickRole(u)} />
              <SmallBtn
                colors={colors}
                label={u.is_active ? "Выкл" : "Вкл"}
                muted={u.is_active}
                disabled={self}
                onPress={() => activeAction.mutate({ id: u.id, active: !u.is_active })}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

// ─── Туры ────────────────────────────────────────────────────

function ToursTab({ colors, isPartner, isStaff }: { colors: ThemeColors; isPartner: boolean; isStaff: boolean }) {
  const queryClient = useQueryClient();
  const { cities } = useCatalog();
  const tours = useQuery({ queryKey: ["backoffice-tours"], queryFn: bo.fetchBackofficeTours });
  const [editor, setEditor] = useState<{ open: boolean; tour: bo.BackofficeTour | null }>({ open: false, tour: null });

  const statusAction = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => bo.setTourStatus(vars.id, vars.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["backoffice-tours"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e: unknown) => showError(errText(e)),
  });

  if (tours.isLoading) return <Loading colors={colors} />;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={tours.isRefetching} onRefresh={() => void tours.refetch()} tintColor={colors.teal} />}
      >
        {isPartner && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Новые туры и правки сохраняются черновиком — на витрину их выводит менеджер.
          </Text>
        )}
        <TouchableOpacity
          style={[styles.createBtn, { borderColor: colors.teal }]}
          onPress={() => setEditor({ open: true, tour: null })}
        >
          <Plus size={17} color={colors.teal} />
          <Text style={[styles.createBtnText, { color: colors.teal }]}>Создать тур</Text>
        </TouchableOpacity>

        {(tours.data ?? []).length === 0 && <Empty colors={colors} text="Туров пока нет — создайте первый" />}
        {(tours.data ?? []).map((t) => {
          const published = t.status === "published";
          return (
            <Card key={t.id} colors={colors}>
              <View style={styles.cardRow}>
                <Image source={{ uri: t.image_url }} style={styles.thumb} contentFit="cover" />
                <View style={styles.flex1}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    {t.city_name} · {Math.round(t.price_kopeks / 100).toLocaleString("ru-RU")}₽ · {t.organizer.name}
                  </Text>
                  <Text style={[styles.statusBadge, { color: published ? colors.mint : colors.gold }]}>
                    {published ? "Опубликован" : isPartner ? "Черновик — публикует менеджер" : "Черновик"}
                  </Text>
                </View>
                <IconBtn colors={colors} bg={colors.inputBg} onPress={() => setEditor({ open: true, tour: t })}>
                  <Pencil size={15} color={colors.textMuted} />
                </IconBtn>
                {isStaff && (
                  <SmallBtn
                    colors={colors}
                    label={published ? "Снять" : "Опубликовать"}
                    muted={published}
                    onPress={() => statusAction.mutate({ id: t.id, status: published ? "draft" : "published" })}
                  />
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {editor.open && (
        <TourEditorModal
          tour={editor.tour}
          cities={cities.map((c) => ({ id: c.id, name: c.name }))}
          isPartner={isPartner}
          onClose={() => setEditor({ open: false, tour: null })}
          onError={showError}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}

// ─── Партнёры (staff) ────────────────────────────────────────

function PartnersTab({ colors, isAdmin }: { colors: ThemeColors; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const partners = useQuery({ queryKey: ["bo-partners"], queryFn: bo.fetchPartners });
  const users = useQuery({ queryKey: ["bo-users", ""], queryFn: () => bo.listUsers() });
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOrg, setAssignOrg] = useState("");
  const [assignInn, setAssignInn] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["bo-partners"] });
    void queryClient.invalidateQueries({ queryKey: ["bo-users"] });
  };
  const assign = useMutation({
    mutationFn: () => bo.createPartner({ user_id: assignUserId, org_name: assignOrg.trim(), inn: assignInn.trim() }),
    onSuccess: () => {
      invalidate();
      setShowAssign(false);
      setAssignUserId(""); setAssignOrg(""); setAssignInn("");
    },
    onError: (e: unknown) => showError(errText(e)),
  });
  const toggleVerified = useMutation({
    mutationFn: (vars: { id: string; verified: boolean }) => bo.updatePartner(vars.id, { verified: vars.verified }),
    onSuccess: invalidate,
    onError: (e: unknown) => showError(errText(e)),
  });

  const candidates = (users.data ?? []).filter((u) => u.role === "user" && u.is_active);

  if (partners.isLoading) return <Loading colors={colors} />;

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={partners.isRefetching} onRefresh={() => void partners.refetch()} tintColor={colors.teal} />}
    >
      {isAdmin && (
        <TouchableOpacity style={[styles.createBtn, { borderColor: colors.teal }]} onPress={() => setShowAssign((v) => !v)}>
          <Plus size={17} color={colors.teal} />
          <Text style={[styles.createBtnText, { color: colors.teal }]}>Назначить партнёра</Text>
        </TouchableOpacity>
      )}

      {showAssign && (
        <Card colors={colors}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Пользователь сначала регистрируется сам, затем выбирается здесь:
          </Text>
          <View style={styles.chipWrap}>
            {candidates.map((u) => (
              <TouchableOpacity
                key={u.id}
                onPress={() => setAssignUserId(u.id)}
                style={[
                  styles.candChip,
                  { backgroundColor: assignUserId === u.id ? colors.teal : colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.candChipText, { color: assignUserId === u.id ? "#FFF" : colors.text }]} numberOfLines={1}>
                  {u.email}
                </Text>
              </TouchableOpacity>
            ))}
            {candidates.length === 0 && (
              <Text style={[styles.hint, { color: colors.textMuted }]}>Нет подходящих пользователей (роль user)</Text>
            )}
          </View>
          <TextInput
            style={[styles.search, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={assignOrg}
            onChangeText={setAssignOrg}
            placeholder="Название организации"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.search, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={assignInn}
            onChangeText={setAssignInn}
            placeholder="ИНН (проверяется вручную)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.teal, opacity: !assignUserId || !assignOrg.trim() || assign.isPending ? 0.5 : 1 }]}
            disabled={!assignUserId || !assignOrg.trim() || assign.isPending}
            onPress={() => assign.mutate()}
          >
            {assign.isPending ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryBtnText}>Назначить</Text>}
          </TouchableOpacity>
        </Card>
      )}

      {(partners.data ?? []).length === 0 && <Empty colors={colors} text="Партнёров пока нет" />}
      {(partners.data ?? []).map((p) => (
        <Card key={p.id} colors={colors}>
          <View style={styles.cardRow}>
            <View style={[styles.avatar, { backgroundColor: colors.teal + "22" }]}>
              <Building2 size={18} color={colors.teal} />
            </View>
            <View style={styles.flex1}>
              <View style={styles.orgNameRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{p.org_name}</Text>
                {p.verified && <BadgeCheck size={14} color={colors.mint} />}
              </View>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
                {p.user_email}{p.inn ? ` · ИНН ${p.inn}` : ""}
              </Text>
            </View>
            <SmallBtn
              colors={colors}
              label={p.verified ? "Снять проверку" : "Подтвердить"}
              muted={p.verified}
              onPress={() => toggleVerified.mutate({ id: p.id, verified: !p.verified })}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── Профиль организации (partner) ───────────────────────────

function OrgTab({ colors }: { colors: ThemeColors }) {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["bo-my-partner"], queryFn: bo.fetchMyPartnerProfile });
  const [form, setForm] = useState({ org_name: "", description: "", phone: "", inn: "" });

  useEffect(() => {
    if (profile.data) {
      setForm({
        org_name: profile.data.org_name,
        description: profile.data.description,
        phone: profile.data.phone,
        inn: profile.data.inn,
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => bo.updateMyPartnerProfile(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bo-my-partner"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      Alert.alert("Готово", "Профиль сохранён — название попадёт в карточки ваших туров");
    },
    onError: (e: unknown) => showError(errText(e)),
  });

  if (profile.isLoading) return <Loading colors={colors} />;
  if (profile.isError) {
    return (
      <View style={styles.listContent}>
        <Empty colors={colors} text="Профиль организации не найден — обратитесь к администратору" />
      </View>
    );
  }

  const input = [styles.search, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }];

  return (
    <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      <Card colors={colors}>
        <View style={styles.orgNameRow}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Профиль организации</Text>
          {profile.data?.verified ? (
            <View style={styles.verifiedRow}>
              <BadgeCheck size={14} color={colors.mint} />
              <Text style={[styles.verifiedText, { color: colors.mint }]}>Проверен</Text>
            </View>
          ) : (
            <Text style={[styles.verifiedText, { color: colors.gold }]}>На проверке</Text>
          )}
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>Название организации</Text>
        <TextInput style={input} value={form.org_name} onChangeText={(v) => setForm((f) => ({ ...f, org_name: v }))} />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Описание</Text>
        <TextInput
          style={[...input, styles.orgDescription]}
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          multiline
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Телефон</Text>
        <TextInput style={input} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
        <Text style={[styles.hint, { color: colors.textMuted }]}>ИНН</Text>
        <TextInput style={input} value={form.inn} onChangeText={(v) => setForm((f) => ({ ...f, inn: v }))} keyboardType="number-pad" />
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.teal, opacity: save.isPending || !form.org_name.trim() ? 0.6 : 1 }]}
          disabled={save.isPending || !form.org_name.trim()}
          onPress={() => save.mutate()}
        >
          {save.isPending ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryBtnText}>Сохранить</Text>}
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

// ─── Мелкие общие компоненты ─────────────────────────────────

function Card({ colors, children }: { colors: ThemeColors; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
  );
}

function IconBtn({
  colors,
  bg,
  onPress,
  children,
}: {
  colors: ThemeColors;
  bg: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

function SmallBtn({
  colors,
  label,
  onPress,
  muted,
  disabled,
}: {
  colors: ThemeColors;
  label: string;
  onPress: () => void;
  muted?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.smallBtn,
        { backgroundColor: muted ? colors.inputBg : colors.teal, opacity: disabled ? 0.4 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.smallBtnText, { color: muted ? colors.textMuted : "#FFF" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Loading({ colors }: { colors: ThemeColors }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.teal} />
    </View>
  );
}

function Empty({ colors, text }: { colors: ThemeColors; text: string }) {
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Check size={26} color={colors.mint} />
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  deniedTitle: { fontSize: 19, fontWeight: "700" },
  deniedText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  backBtn: { marginTop: 10, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  backBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  tabBarWrap: { paddingVertical: 8 },
  tabBar: { paddingHorizontal: 12, gap: 6 },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tabChipText: { fontSize: 13, fontWeight: "600" },
  listContent: { padding: 12, paddingBottom: 40, gap: 8 },
  groupTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 8 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  thumb: { width: 48, height: 48, borderRadius: 9 },
  thumbSm: { width: 32, height: 32, borderRadius: 7 },
  flex1: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardMeta: { fontSize: 12, marginTop: 1 },
  statusBadge: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  smallBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 130 },
  smallBtnText: { fontSize: 12, fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, fontWeight: "700" },
  reviewText: { fontSize: 13, lineHeight: 18, borderRadius: 8, padding: 8 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  hint: { fontSize: 12, lineHeight: 16 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 11,
  },
  createBtnText: { fontSize: 14, fontWeight: "700" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  candChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "100%" },
  candChipText: { fontSize: 12, fontWeight: "600" },
  primaryBtn: { borderRadius: 10, height: 44, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  orgNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { fontSize: 12, fontWeight: "700" },
  orgDescription: { minHeight: 70, textAlignVertical: "top" },
  empty: { alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 26 },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 16 },
});

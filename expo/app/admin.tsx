import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  LogOut,
  ShieldCheck,
  Users,
  Video,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Send,
  UserCog,
  BarChart3,
  ShoppingBag,
  Star,
  FileText,
  Mail,
  UserCheck,
  Save,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { useReels } from "@/providers/ReelsProvider";
import { usePartners } from "@/providers/PartnersProvider";
import { UserRole, LegalDocKey } from "@/types/tour";

type Tab = "stats" | "users" | "reels" | "partner" | "partnerApprovals" | "docs" | "emails" | "replies" | "chatUsers" | "chatPartners";

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: "stats", label: "Статистика", Icon: BarChart3 },
  { key: "users", label: "Пользователи", Icon: Users },
  { key: "partnerApprovals", label: "Анкеты партнёров", Icon: UserCheck },
  { key: "reels", label: "Reels", Icon: Video },
  { key: "partner", label: "Туры партнёров", Icon: Briefcase },
  { key: "replies", label: "Ответы на отзывы", Icon: Star },
  { key: "docs", label: "Документы", Icon: FileText },
  { key: "emails", label: "Email-рассылки", Icon: Mail },
  { key: "chatUsers", label: "Чат: пользователи", Icon: MessageSquare },
  { key: "chatPartners", label: "Чат: партнёры", Icon: MessageSquare },
];

const ROLE_OPTIONS: UserRole[] = ["user", "manager", "admin"];
const ROLE_LABEL: Record<UserRole, string> = { user: "Пользователь", manager: "Менеджер", admin: "Админ" };

export default function AdminScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const admin = useAdmin();
  const { reels, moderationReels, approveReel, rejectReel } = useReels();
  const partners = usePartners();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [tab, setTab] = useState<Tab>("stats");
  const [chatInputUsers, setChatInputUsers] = useState<string>("");
  const [chatInputPartners, setChatInputPartners] = useState<string>("");
  const [regTextDraft, setRegTextDraft] = useState<string>(partners.registrationText);
  const [docKey, setDocKey] = useState<LegalDocKey>("terms");
  const [docTitleDraft, setDocTitleDraft] = useState<string>(partners.legalDocs["terms"].title);
  const [docBodyDraft, setDocBodyDraft] = useState<string>(partners.legalDocs["terms"].body);

  const switchDoc = useCallback((k: LegalDocKey) => {
    setDocKey(k);
    setDocTitleDraft(partners.legalDocs[k].title);
    setDocBodyDraft(partners.legalDocs[k].body);
  }, [partners.legalDocs]);

  const handleLogin = useCallback(() => {
    if (!admin.login(username, password)) {
      Alert.alert("Ошибка входа", "Неверный логин или пароль");
    } else {
      setUsername("");
      setPassword("");
    }
  }, [admin, username, password]);

  const handleLogout = useCallback(() => {
    admin.logout();
    router.back();
  }, [admin, router]);

  const stats = admin.stats;
  const publishedReels = useMemo(() => reels.filter((r) => r.status === "published").length, [reels]);

  if (!admin.isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Админ-панель", headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: "#FFFFFF" }} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginWrap}>
          <View style={[styles.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={[styles.loginIconWrap, { backgroundColor: colors.tealSoft }]}>
              <ShieldCheck size={36} color={colors.teal} />
            </View>
            <Text style={[styles.loginTitle, { color: colors.text }]}>{"Вход в панель администратора"}</Text>
            <Text style={[styles.loginSubtitle, { color: colors.textMuted }]}>{"Используйте свои административные данные"}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Логин"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              testID="admin-login-user"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Пароль"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              testID="admin-login-password"
            />
            <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.teal }]} onPress={handleLogin} activeOpacity={0.8} testID="admin-login-submit">
              <Text style={styles.loginBtnText}>{"Войти"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginBack} onPress={() => router.back()} activeOpacity={0.7}>
              <ChevronLeft size={16} color={colors.textMuted} />
              <Text style={[styles.loginBackText, { color: colors.textMuted }]}>{"Назад в профиль"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Админ-панель",
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: "#FFFFFF",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
              style={[styles.tabChip, { backgroundColor: active ? colors.teal : colors.surface, borderColor: active ? colors.teal : colors.border }]}
              testID={`admin-tab-${t.key}`}
            >
              <t.Icon size={14} color={active ? "#FFFFFF" : colors.textSecondary} />
              <Text style={[styles.tabChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {tab === "stats" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Сводка"}</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Всего пользователей" value={stats.totalUsers} icon={<Users size={18} color={colors.teal} />} colors={colors} />
              <StatCard label="Менеджеров" value={stats.managers} icon={<UserCog size={18} color={colors.gold} />} colors={colors} />
              <StatCard label="Куплено туров" value={stats.totalPurchased} icon={<ShoppingBag size={18} color={colors.green} />} colors={colors} />
              <StatCard label="Reels опубликовано" value={publishedReels} icon={<Video size={18} color={colors.coral} />} colors={colors} />
              <StatCard label="Reels на модерации" value={moderationReels.length} icon={<Video size={18} color={colors.orange} />} colors={colors} />
              <StatCard label="Туры партнёров (ждут)" value={stats.pendingPartnerTours} icon={<Briefcase size={18} color={colors.teal} />} colors={colors} />
              <StatCard label="Ответы на отзывы (ждут)" value={partners.pendingReplies.length} icon={<Star size={18} color={colors.gold} />} colors={colors} />
              <StatCard label="Анкеты партнёров" value={partners.pendingPartners.length} icon={<UserCheck size={18} color={colors.teal} />} colors={colors} />
              <StatCard label="Email отправлено" value={partners.emailNotifications.length} icon={<Mail size={18} color={colors.gold} />} colors={colors} />
            </View>
            <Text style={[styles.h2, { color: colors.text }]}>{"Последние регистрации"}</Text>
            {admin.users.slice(0, 5).map((u) => (
              <View key={u.id} style={[styles.userRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={[styles.userAvatar, { backgroundColor: colors.tealSoft }]}>
                  <Text style={[styles.userInitials, { color: colors.teal }]}>{u.firstName.slice(0, 1) + u.lastName.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.text }]}>{`${u.firstName} ${u.lastName}`}</Text>
                  <Text style={[styles.userMeta, { color: colors.textMuted }]}>{`${u.city} · ${u.registeredAt}`}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: colors.tealMuted }]}>
                  <Text style={[styles.rolePillText, { color: colors.teal }]}>{ROLE_LABEL[u.role]}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === "users" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Пользователи"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{"Имя, контакты, регистрация, покупки, роль"}</Text>
            {admin.users.map((u) => (
              <View key={u.id} style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={styles.userCardTop}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.tealSoft }]}>
                    <Text style={[styles.userInitials, { color: colors.teal }]}>{u.firstName.slice(0, 1) + u.lastName.slice(0, 1)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>{`${u.firstName} ${u.lastName}`}</Text>
                    <Text style={[styles.userMeta, { color: colors.textMuted }]}>{u.email}</Text>
                    <Text style={[styles.userMeta, { color: colors.textMuted }]}>{u.phone}</Text>
                  </View>
                </View>
                <View style={styles.userCardStats}>
                  <View style={styles.userStatBlock}>
                    <Text style={[styles.userStatLabel, { color: colors.textMuted }]}>{"Город"}</Text>
                    <Text style={[styles.userStatValue, { color: colors.text }]}>{u.city}</Text>
                  </View>
                  <View style={styles.userStatBlock}>
                    <Text style={[styles.userStatLabel, { color: colors.textMuted }]}>{"Регистрация"}</Text>
                    <Text style={[styles.userStatValue, { color: colors.text }]}>{u.registeredAt}</Text>
                  </View>
                  <View style={styles.userStatBlock}>
                    <Text style={[styles.userStatLabel, { color: colors.textMuted }]}>{"Куплено"}</Text>
                    <Text style={[styles.userStatValue, { color: colors.text }]}>{`${u.purchasedToursCount}`}</Text>
                  </View>
                </View>
                <View style={styles.roleRow}>
                  {ROLE_OPTIONS.map((role) => {
                    const active = u.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleBtn, { borderColor: active ? colors.teal : colors.border, backgroundColor: active ? colors.tealSoft : "transparent" }]}
                        onPress={() => admin.setUserRole(u.id, role)}
                        activeOpacity={0.7}
                        testID={`role-${u.id}-${role}`}
                      >
                        <Text style={[styles.roleBtnText, { color: active ? colors.teal : colors.textSecondary }]}>{ROLE_LABEL[role]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === "reels" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Модерация Reels"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{`${moderationReels.length} видео ожидают модерации`}</Text>
            {moderationReels.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{"Нет видео на модерации"}</Text>
            ) : (
              moderationReels.map((r) => (
                <View key={r.id} style={[styles.modCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Image source={{ uri: r.coverImage }} style={styles.modCover} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modTitle, { color: colors.text }]} numberOfLines={2}>{r.title}</Text>
                    <Text style={[styles.modMeta, { color: colors.textMuted }]} numberOfLines={1}>{r.author}</Text>
                    <Text style={[styles.modMeta, { color: colors.textMuted }]}>{`${r.city} · ${r.createdAt}`}</Text>
                    <View style={styles.modActions}>
                      <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.green }]} onPress={() => approveReel(r.id)} activeOpacity={0.8}>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"В ленту"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.red }]} onPress={() => rejectReel(r.id)} activeOpacity={0.8}>
                        <XCircle size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"Отклонить"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === "partner" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Туры партнёров"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{"Проверка и публикация добавленных партнёрами туров"}</Text>
            {admin.partnerTours.map((t) => (
              <View key={t.id} style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Image source={{ uri: t.image }} style={styles.partnerImage} contentFit="cover" />
                <View style={styles.partnerBody}>
                  <Text style={[styles.partnerTitle, { color: colors.text }]} numberOfLines={2}>{t.title}</Text>
                  <Text style={[styles.partnerMeta, { color: colors.textMuted }]}>{`${t.partner} · ${t.city}`}</Text>
                  <Text style={[styles.partnerMeta, { color: colors.textMuted }]}>{`Цена: ${t.price.toLocaleString()} ₽`}</Text>
                  <View style={[styles.partnerStatusPill, {
                    backgroundColor: t.status === "published" ? colors.greenLight : t.status === "rejected" ? "rgba(231,76,60,0.12)" : colors.orangeLight,
                  }]}>
                    <Text style={[styles.partnerStatusText, {
                      color: t.status === "published" ? colors.green : t.status === "rejected" ? colors.red : colors.orange,
                    }]}>
                      {t.status === "published" ? "Опубликовано" : t.status === "rejected" ? "Отклонено" : "На модерации"}
                    </Text>
                  </View>
                  {t.status === "pending" ? (
                    <View style={styles.modActions}>
                      <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.green }]} onPress={() => admin.approvePartnerTour(t.id)} activeOpacity={0.8}>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"Опубликовать"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.red }]} onPress={() => admin.rejectPartnerTour(t.id)} activeOpacity={0.8}>
                        <XCircle size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"Отклонить"}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === "replies" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Ответы партнёров на отзывы"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{`${partners.pendingReplies.length} ответов ожидает публикации`}</Text>
            {partners.pendingReplies.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{"Нет ответов на модерации"}</Text>
            ) : (
              partners.pendingReplies.map((rv) => {
                if (!rv.reply) return null;
                return (
                  <View key={rv.reply.id} style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "column" as const, alignItems: "stretch" as const }]}>
                    <View style={styles.replyOriginalBox}>
                      <View style={styles.replyStarsRow}>
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} size={12} color={colors.gold} fill={i <= rv.rating ? colors.gold : "transparent"} />
                        ))}
                        <Text style={[styles.replyOriginalAuthor, { color: colors.text }]}>{rv.author}</Text>
                        <Text style={[styles.replyOriginalDate, { color: colors.textMuted }]}>{rv.createdAt}</Text>
                      </View>
                      <Text style={[styles.replyOriginalText, { color: colors.textSecondary }]}>{rv.text}</Text>
                    </View>
                    <View style={[styles.replyAdminBox, { backgroundColor: colors.tealSoft, borderColor: colors.teal }]}>
                      <Text style={[styles.replyAdminLabel, { color: colors.teal }]}>{`Ответ партнёра · ИНН ${rv.reply.partnerInn}`}</Text>
                      <Text style={[styles.replyAdminText, { color: colors.text }]}>{rv.reply.content}</Text>
                    </View>
                    <View style={styles.modActions}>
                      <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.green }]} onPress={() => partners.approveReply(rv.id)} activeOpacity={0.8} testID={`reply-approve-${rv.id}`}>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"Опубликовать"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modBtn, { backgroundColor: colors.red }]}
                        onPress={() => {
                          Alert.prompt?.(
                            "Отклонить ответ",
                            "Укажите причину отказа (опционально)",
                            (text?: string) => partners.rejectReply(rv.id, text)
                          );
                          if (!Alert.prompt) partners.rejectReply(rv.id);
                        }}
                        activeOpacity={0.8}
                        testID={`reply-reject-${rv.id}`}
                      >
                        <XCircle size={14} color="#FFFFFF" />
                        <Text style={styles.modBtnText}>{"Отклонить"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {tab === "partnerApprovals" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Анкеты партнёров на проверке"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{"Проверьте данные ФНС и контакты, затем подтвердите или отклоните регистрацию"}</Text>
            {partners.pendingPartners.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{"Нет анкет на проверке"}</Text>
            ) : (
              partners.pendingPartners.map((pp) => (
                <View key={pp.inn} style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "column" as const, alignItems: "stretch" as const, gap: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={[styles.statIcon, { backgroundColor: colors.tealSoft, marginBottom: 0 }]}>
                      <ShieldCheck size={18} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.partnerTitle, { color: colors.text }]} numberOfLines={2}>{pp.legalName}</Text>
                      <Text style={[styles.partnerMeta, { color: colors.textMuted }]}>{pp.entityType === "company" ? "Юр. лицо" : pp.entityType === "ip" ? "ИП" : "Самозанятый"}</Text>
                    </View>
                    <View style={[styles.partnerStatusPill, { backgroundColor: colors.orangeLight }]}>
                      <Text style={[styles.partnerStatusText, { color: colors.orange }]}>{"На проверке"}</Text>
                    </View>
                  </View>
                  <View style={styles.approvalGrid}>
                    <ApprovalField colors={colors} label="ИНН" value={pp.inn} />
                    {pp.ogrn ? <ApprovalField colors={colors} label="ОГРН" value={pp.ogrn} /> : null}
                    {pp.ceo ? <ApprovalField colors={colors} label="Руководитель" value={pp.ceo} /> : null}
                    <ApprovalField colors={colors} label="Адрес" value={pp.address} />
                    <ApprovalField colors={colors} label="Дата в ФНС" value={pp.taxRegistrationDate ?? "—"} />
                    <ApprovalField colors={colors} label="Email" value={pp.email ?? "—"} />
                    <ApprovalField colors={colors} label="Телефон" value={pp.phone ?? "—"} />
                    <ApprovalField colors={colors} label="Telegram" value={pp.telegram ? `@${pp.telegram}` : "—"} />
                  </View>
                  <View style={styles.modActions}>
                    <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.green }]} onPress={() => { partners.approvePartner(pp.inn); Alert.alert("Подтверждено", `Партнёр ${pp.legalName} подтверждён. Уведомление отправлено на ${pp.email ?? "email"}.`); }} activeOpacity={0.8} testID={`approve-partner-${pp.inn}`}>
                      <CheckCircle2 size={14} color="#FFFFFF" />
                      <Text style={styles.modBtnText}>{"Подтвердить"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modBtn, { backgroundColor: colors.red }]}
                      onPress={() => {
                        const doReject = (reason?: string) => { partners.rejectPartner(pp.inn, reason); Alert.alert("Отклонено", `Анкета ${pp.legalName} отклонена.`); };
                        if (Alert.prompt) {
                          Alert.prompt("Отклонить анкету", "Укажите причину (опционально)", (text?: string) => doReject(text));
                        } else { doReject(); }
                      }}
                      activeOpacity={0.8}
                      testID={`reject-partner-${pp.inn}`}
                    >
                      <XCircle size={14} color="#FFFFFF" />
                      <Text style={styles.modBtnText}>{"Отклонить"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === "docs" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Редактор текстов и документов"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{"Изменения в договорах можно разослать всем партнёрам по email"}</Text>

            <Text style={[styles.h2, { color: colors.text }]}>{"Текст на экране регистрации"}</Text>
            <TextInput
              style={[styles.docTextarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={regTextDraft}
              onChangeText={setRegTextDraft}
              multiline
              testID="admin-reg-text"
            />
            <TouchableOpacity
              style={[styles.modBtn, { backgroundColor: colors.teal, alignSelf: "flex-start" as const, marginTop: 8 }]}
              onPress={() => { partners.updateRegistrationText(regTextDraft); Alert.alert("Сохранено", "Текст регистрации обновлён."); }}
              activeOpacity={0.8}
              testID="admin-save-reg-text"
            >
              <Save size={14} color="#FFFFFF" />
              <Text style={styles.modBtnText}>{"Сохранить"}</Text>
            </TouchableOpacity>

            <Text style={[styles.h2, { color: colors.text }]}>{"Юридические документы"}</Text>
            <View style={styles.docTabs}>
              {(["terms","privacy","offer"] as LegalDocKey[]).map((k) => {
                const active = docKey === k;
                const label = k === "terms" ? "Соглашение" : k === "privacy" ? "ПД" : "Оферта";
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => switchDoc(k)}
                    style={[styles.docTabBtn, { backgroundColor: active ? colors.teal : colors.surface, borderColor: active ? colors.teal : colors.border }]}
                    activeOpacity={0.75}
                    testID={`doc-tab-${k}`}
                  >
                    <Text style={[styles.docTabText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.docFieldLabel, { color: colors.textMuted }]}>{"Заголовок"}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={docTitleDraft}
              onChangeText={setDocTitleDraft}
              testID="admin-doc-title"
            />
            <Text style={[styles.docFieldLabel, { color: colors.textMuted }]}>{"Текст документа"}</Text>
            <TextInput
              style={[styles.docTextarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, minHeight: 260 }]}
              value={docBodyDraft}
              onChangeText={setDocBodyDraft}
              multiline
              testID="admin-doc-body"
            />
            <Text style={[styles.helper, { color: colors.textMuted, marginTop: 8 }]}>{`Обновлён: ${partners.legalDocs[docKey].updatedAt}`}</Text>
            <View style={styles.modActions}>
              <TouchableOpacity
                style={[styles.modBtn, { backgroundColor: colors.teal }]}
                onPress={() => { partners.updateLegalDoc(docKey, { title: docTitleDraft, body: docBodyDraft }, false); Alert.alert("Сохранено", "Документ обновлён без уведомления."); }}
                activeOpacity={0.8}
                testID="admin-save-doc"
              >
                <Save size={14} color="#FFFFFF" />
                <Text style={styles.modBtnText}>{"Сохранить"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modBtn, { backgroundColor: colors.gold }]}
                onPress={() => {
                  partners.updateLegalDoc(docKey, { title: docTitleDraft, body: docBodyDraft }, true);
                  Alert.alert("Отправлено", "Документ обновлён, уведомления отправлены партнёрам по email.");
                }}
                activeOpacity={0.8}
                testID="admin-save-doc-notify"
              >
                <Mail size={14} color="#FFFFFF" />
                <Text style={styles.modBtnText}>{"Сохранить и уведомить"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {tab === "emails" ? (
          <View>
            <Text style={[styles.h1, { color: colors.text }]}>{"Email-рассылки партнёрам"}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>{`Всего отправлено: ${partners.emailNotifications.length}`}</Text>
            {partners.emailNotifications.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{"Рассылок пока не было"}</Text>
            ) : (
              [...partners.emailNotifications].reverse().map((m) => (
                <View key={m.id} style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <View style={[styles.statIcon, { backgroundColor: colors.tealSoft, marginBottom: 0 }]}>
                      <Mail size={16} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={2}>{m.subject}</Text>
                      <Text style={[styles.userMeta, { color: colors.textMuted }]}>{`Кому: ${m.email} · ИНН ${m.partnerInn}`}</Text>
                      <Text style={[styles.userMeta, { color: colors.textMuted }]}>{m.sentAt}</Text>
                    </View>
                  </View>
                  <Text style={[styles.docFieldLabel, { color: colors.textMuted, marginTop: 8 }]}>{"Текст письма"}</Text>
                  <Text style={[styles.replyAdminText, { color: colors.text }]}>{m.body}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === "chatUsers" || tab === "chatPartners" ? (
          <ChatPane
            title={tab === "chatUsers" ? "Чат с пользователями" : "Чат с партнёрами"}
            messages={tab === "chatUsers" ? admin.userChats : admin.partnerChats}
            input={tab === "chatUsers" ? chatInputUsers : chatInputPartners}
            onChange={tab === "chatUsers" ? setChatInputUsers : setChatInputPartners}
            onSend={() => {
              if (tab === "chatUsers") {
                if (!chatInputUsers.trim()) return;
                admin.sendUserChatMessage(chatInputUsers.trim());
                setChatInputUsers("");
              } else {
                if (!chatInputPartners.trim()) return;
                admin.sendPartnerChatMessage(chatInputPartners.trim());
                setChatInputPartners("");
              }
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, colors }: { label: string; value: number; icon: React.ReactNode; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[styles.statIcon, { backgroundColor: colors.tealSoft }]}>{icon}</View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ChatPane({ title, messages, input, onChange, onSend }: {
  title: string;
  messages: { id: string; authorName: string; authorType: "user" | "partner" | "admin"; content: string; createdAt: string }[];
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.h1, { color: colors.text }]}>{title}</Text>
      <View style={[styles.chatBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {messages.map((m) => {
          const isAdmin = m.authorType === "admin";
          return (
            <View key={m.id} style={[styles.chatRow, isAdmin ? styles.chatRowRight : styles.chatRowLeft]}>
              <View style={[styles.bubble, { backgroundColor: isAdmin ? colors.teal : colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={[styles.bubbleAuthor, { color: isAdmin ? "rgba(255,255,255,0.85)" : colors.textMuted }]}>{m.authorName}</Text>
                <Text style={[styles.bubbleText, { color: isAdmin ? "#FFFFFF" : colors.text }]}>{m.content}</Text>
                <Text style={[styles.bubbleTime, { color: isAdmin ? "rgba(255,255,255,0.7)" : colors.textMuted }]}>{m.createdAt}</Text>
              </View>
            </View>
          );
        })}
        <View style={styles.chatInputRow}>
          <TextInput
            style={[styles.chatInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Сообщение"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={onChange}
          />
          <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: colors.teal }]} onPress={onSend} activeOpacity={0.8}>
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loginWrap: { flex: 1, padding: 20, justifyContent: "center" },
  loginCard: { padding: 24, borderRadius: 20, borderWidth: 1, gap: 12, alignItems: "stretch" },
  loginIconWrap: { width: 70, height: 70, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 8 },
  loginTitle: { fontSize: 18, fontWeight: "800" as const, textAlign: "center" as const },
  loginSubtitle: { fontSize: 13, textAlign: "center" as const, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14 },
  loginBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" as const },
  loginBack: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 4, marginTop: 4 },
  loginBackText: { fontSize: 12, fontWeight: "500" as const },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tabChipText: { fontSize: 12, fontWeight: "700" as const },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 20, fontWeight: "800" as const, marginBottom: 6 },
  h2: { fontSize: 15, fontWeight: "700" as const, marginTop: 18, marginBottom: 8 },
  helper: { fontSize: 12, marginBottom: 12 },
  empty: { fontSize: 13, textAlign: "center" as const, paddingVertical: 16 },
  statsGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10, marginTop: 4 },
  statCard: { width: "48%", padding: 14, borderRadius: 14, borderWidth: 1 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "800" as const },
  statLabel: { fontSize: 11, marginTop: 2 },
  userRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  userAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  userInitials: { fontSize: 13, fontWeight: "800" as const },
  userName: { fontSize: 14, fontWeight: "700" as const },
  userMeta: { fontSize: 11, marginTop: 2 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rolePillText: { fontSize: 11, fontWeight: "700" as const },
  userCard: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  userCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  userCardStats: { flexDirection: "row", gap: 12, marginTop: 10 },
  userStatBlock: { flex: 1 },
  userStatLabel: { fontSize: 10 },
  userStatValue: { fontSize: 13, fontWeight: "700" as const, marginTop: 2 },
  roleRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  roleBtnText: { fontSize: 11, fontWeight: "700" as const },
  modCard: { flexDirection: "row", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  modCover: { width: 70, height: 90, borderRadius: 10 },
  modTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 4 },
  modMeta: { fontSize: 11, marginTop: 2 },
  modActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  modBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  modBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" as const },
  partnerCard: { flexDirection: "row", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  partnerImage: { width: 80, height: 80, borderRadius: 10 },
  partnerBody: { flex: 1 },
  partnerTitle: { fontSize: 14, fontWeight: "700" as const },
  partnerMeta: { fontSize: 11, marginTop: 2 },
  partnerStatusPill: { alignSelf: "flex-start" as const, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 6 },
  partnerStatusText: { fontSize: 10, fontWeight: "700" as const },
  chatBox: { padding: 12, borderRadius: 14, borderWidth: 1 },
  chatRow: { flexDirection: "row", marginBottom: 8 },
  chatRowLeft: { justifyContent: "flex-start" as const },
  chatRowRight: { justifyContent: "flex-end" as const },
  bubble: { maxWidth: "82%", padding: 10, borderRadius: 14, borderWidth: 1 },
  bubbleAuthor: { fontSize: 10, fontWeight: "700" as const, marginBottom: 4 },
  bubbleText: { fontSize: 13, lineHeight: 18 },
  bubbleTime: { fontSize: 9, marginTop: 4 },
  chatInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  chatInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  replyOriginalBox: { padding: 4, gap: 6 },
  replyStarsRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, flexWrap: "wrap" as const },
  replyOriginalAuthor: { fontSize: 13, fontWeight: "700" as const, marginLeft: 4 },
  replyOriginalDate: { fontSize: 11, marginLeft: "auto" as const },
  replyOriginalText: { fontSize: 13, lineHeight: 18 },
  replyAdminBox: { borderRadius: 12, padding: 10, borderWidth: 1, gap: 4, marginTop: 10 },
  replyAdminLabel: { fontSize: 11, fontWeight: "700" as const },
  replyAdminText: { fontSize: 13, lineHeight: 18 },
  docTextarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, minHeight: 100, textAlignVertical: "top" as const, marginTop: 6 },
  docTabs: { flexDirection: "row" as const, gap: 8, marginTop: 6, marginBottom: 6 },
  docTabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  docTabText: { fontSize: 12, fontWeight: "700" as const },
  docFieldLabel: { fontSize: 11, fontWeight: "700" as const, marginTop: 10, marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.4 },
  approvalGrid: { gap: 4, paddingVertical: 6 },
  approvalRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const, gap: 12, paddingVertical: 3 },
  approvalLabel: { fontSize: 11, fontWeight: "600" as const, flexShrink: 0 },
  approvalValue: { fontSize: 12, fontWeight: "700" as const, flex: 1, textAlign: "right" as const },
});

function ApprovalField({ colors, label, value }: { colors: ReturnType<typeof useTheme>["colors"]; label: string; value: string }) {
  return (
    <View style={styles.approvalRow}>
      <Text style={[styles.approvalLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.approvalValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

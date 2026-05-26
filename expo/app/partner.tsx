import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Users,
  Wallet,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  ChevronRight,
  LogOut,
  Calendar,
  Filter,
  AlertCircle,
  ImagePlus,
  Video as VideoIcon,
  X as XIcon,
  Play,
  Check,
  Square,
  CheckSquare,
  Star,
  FileText,
  MessageSquare,
} from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { usePartners } from "@/providers/PartnersProvider";
import {
  PartnerTourSubmission,
  PartnerMediaItem,
  DurationType,
  TransportType,
  InterestType,
  CategoryType,
  SeasonType,
  LegalDocKey,
} from "@/types/tour";

type Tab = "tours" | "guests" | "transactions" | "reviews" | "chat";
type Period = "week" | "month" | "halfYear" | "year" | "all";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop";

const periodLabels: Record<Period, string> = {
  week: "Неделя",
  month: "Месяц",
  halfYear: "Полгода",
  year: "Год",
  all: "Всё время",
};

export default function PartnerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const partners = usePartners();
  const [innInput, setInnInput] = useState<string>("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(false);
  const [acceptedOffer, setAcceptedOffer] = useState<boolean>(false);
  const [openDoc, setOpenDoc] = useState<LegalDocKey | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [telegramInput, setTelegramInput] = useState<string>("");
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Tab>("tours");
  const [period, setPeriod] = useState<Period>("month");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [chatTourId, setChatTourId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>("");

  // Add tour form state
  const [fTitle, setFTitle] = useState<string>("");
  const [fDesc, setFDesc] = useState<string>("");
  const [fCity, setFCity] = useState<string>("");
  const [fPrice, setFPrice] = useState<string>("");
  const [fGroupSize, setFGroupSize] = useState<string>("");
  const [fMeeting, setFMeeting] = useState<string>("");
  const [fDuration, setFDuration] = useState<DurationType>("one_day");
  const [fTransport, setFTransport] = useState<TransportType>("auto");
  const [fInterest, setFInterest] = useState<InterestType>("city");
  const [fCategory, setFCategory] = useState<CategoryType | undefined>(undefined);
  const [fSeason, setFSeason] = useState<SeasonType>("all_year");
  const [fMedia, setFMedia] = useState<PartnerMediaItem[]>([]);

  const pickMedia = useCallback(async (kind: "image" | "video") => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Нет доступа", "Разрешите доступ к медиатеке в настройках.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === "image" ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: kind === "image",
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled) return;
      const items: PartnerMediaItem[] = result.assets.map((a) => ({ uri: a.uri, type: kind }));
      setFMedia((prev) => [...prev, ...items]);
    } catch (e) {
      console.log("[partner] pickMedia error", e);
      Alert.alert("Ошибка", "Не удалось загрузить файл.");
    }
  }, []);

  const removeMedia = useCallback((uri: string) => {
    setFMedia((prev) => prev.filter((m) => m.uri !== uri));
  }, []);

  const allAccepted = acceptedTerms && acceptedPrivacy && acceptedOffer;

  const handleVerify = useCallback(async () => {
    setVerifyError(null);
    if (!acceptedTerms || !acceptedPrivacy || !acceptedOffer) {
      setVerifyError("Необходимо принять все условия ниже.");
      return;
    }
    const res = await partners.verifyAndRegister(innInput);
    if (!res.ok) {
      setVerifyError(res.error ?? "Ошибка проверки");
    } else {
      setInnInput("");
    }
  }, [innInput, partners, acceptedTerms, acceptedPrivacy, acceptedOffer]);

  const submitReply = useCallback((reviewId: string) => {
    const text = (replyDrafts[reviewId] ?? "").trim();
    if (!text) return;
    partners.submitReviewReply(reviewId, text);
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
    Alert.alert("Отправлено на модерацию", "Ваш ответ будет опубликован после проверки администратором.");
  }, [partners, replyDrafts]);

  const submitNewTour = useCallback(() => {
    if (!fTitle.trim() || !fCity.trim() || !fPrice.trim()) {
      Alert.alert("Заполните поля", "Название, город и цена обязательны.");
      return;
    }
    const priceNum = Number(fPrice.replace(/[^\d]/g, ""));
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Некорректная цена", "Введите число.");
      return;
    }
    const firstImage = fMedia.find((m) => m.type === "image");
    partners.submitTour({
      title: fTitle.trim(),
      description: fDesc.trim(),
      city: fCity.trim(),
      price: priceNum,
      currency: "₽",
      image: firstImage?.uri ?? DEFAULT_IMAGE,
      media: fMedia,
      duration: fDuration,
      transport: fTransport,
      interest: fInterest,
      category: fCategory,
      season: fSeason,
      groupSize: fGroupSize.trim() || "до 15 человек",
      meetingPoint: fMeeting.trim() || `${fCity.trim()}, центр`,
    });
    setFTitle("");
    setFDesc("");
    setFCity("");
    setFPrice("");
    setFGroupSize("");
    setFMeeting("");
    setFMedia([]);
    setShowAddForm(false);
    Alert.alert("Отправлено", "Экскурсия отправлена администратору на модерацию.");
  }, [partners, fTitle, fDesc, fCity, fPrice, fGroupSize, fMeeting, fDuration, fTransport, fInterest, fCategory, fSeason, fMedia]);

  const submitContacts = useCallback(() => {
    setContactsError(null);
    const email = emailInput.trim();
    const phone = phoneInput.trim();
    const telegram = telegramInput.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = phone.replace(/\D/g, "").length >= 10;
    if (!emailValid) { setContactsError("Введите корректный email."); return; }
    if (!phoneValid) { setContactsError("Введите корректный телефон (минимум 10 цифр)."); return; }
    if (!telegram) { setContactsError("Укажите никнейм в Telegram."); return; }
    partners.submitContacts({ email, phone, telegram });
    Alert.alert("Заявка отправлена", "Ваш аккаунт направлен администратору на проверку. Уведомление придёт на указанный email.");
  }, [emailInput, phoneInput, telegramInput, partners]);

  // ============ REGISTRATION VIEW ============
  if (!partners.isRegistered) {
    return (
      <>
        <Stack.Screen options={{ title: "Стать партнёром", headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.white }} />
        <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.regContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.heroCard, { backgroundColor: colors.headerBg }]}>
              <View style={[styles.heroIcon, { backgroundColor: colors.teal + "30" }]}>
                <Building2 size={36} color={colors.tealLight} />
              </View>
              <Text style={styles.heroTitle}>Партнёрская программа YAVOY</Text>
              <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.75)" }]}>Размещайте свои экскурсии в одном из крупнейших агрегаторов России. Получайте бронирования, аналитику и поддержку.</Text>
              <View style={styles.heroBenefitsRow}>
                <View style={styles.heroBenefit}><CheckCircle size={14} color={colors.tealLight} /><Text style={styles.heroBenefitText}>Без абон. платы</Text></View>
                <View style={styles.heroBenefit}><CheckCircle size={14} color={colors.tealLight} /><Text style={styles.heroBenefitText}>Аналитика</Text></View>
                <View style={styles.heroBenefit}><CheckCircle size={14} color={colors.tealLight} /><Text style={styles.heroBenefitText}>Чат с клиентом</Text></View>
              </View>
            </View>

            <View style={[styles.regCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <View style={styles.regHeader}>
                <ShieldCheck size={20} color={colors.teal} />
                <Text style={[styles.regHeaderText, { color: colors.text }]}>Регистрация через ФНС</Text>
              </View>
              <Text style={[styles.regDesc, { color: colors.textSecondary }]}>
                {partners.registrationText}
              </Text>
              <TextInput
                style={[styles.regInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="ИНН (10/12 цифр) или ОГРН (13/15 цифр)"
                placeholderTextColor={colors.textMuted}
                value={innInput}
                onChangeText={(t) => { setInnInput(t); setVerifyError(null); }}
                keyboardType="number-pad"
                maxLength={15}
                testID="partner-inn-input"
              />
              {verifyError ? (
                <View style={styles.errorRow}>
                  <AlertCircle size={14} color={colors.red} />
                  <Text style={[styles.errorText, { color: colors.red }]}>{verifyError}</Text>
                </View>
              ) : null}
              <View style={styles.legalBlock}>
                <LegalCheckbox
                  colors={colors}
                  checked={acceptedTerms}
                  onToggle={() => setAcceptedTerms((v) => !v)}
                  onOpenDoc={() => setOpenDoc("terms")}
                  label="пользовательским соглашением"
                  testID="chk-terms"
                />
                <LegalCheckbox
                  colors={colors}
                  checked={acceptedPrivacy}
                  onToggle={() => setAcceptedPrivacy((v) => !v)}
                  onOpenDoc={() => setOpenDoc("privacy")}
                  label="правилами обработки персональных данных"
                  testID="chk-privacy"
                />
                <LegalCheckbox
                  colors={colors}
                  checked={acceptedOffer}
                  onToggle={() => setAcceptedOffer((v) => !v)}
                  onOpenDoc={() => setOpenDoc("offer")}
                  label="договором-офертой"
                  testID="chk-offer"
                />
              </View>

              <TouchableOpacity
                style={[styles.regSubmitBtn, { backgroundColor: colors.teal, opacity: partners.verifying || innInput.length < 10 || !allAccepted ? 0.6 : 1 }]}
                onPress={handleVerify}
                disabled={partners.verifying || innInput.length < 10 || !allAccepted}
                activeOpacity={0.8}
                testID="partner-verify-btn"
              >
                {partners.verifying ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.regSubmitText}>Проверка в ФНС…</Text>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} color="#FFFFFF" />
                    <Text style={styles.regSubmitText}>Проверить и зарегистрироваться</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={[styles.regNote, { color: colors.textMuted }]}>
                Передавая ИНН/ОГРН, вы соглашаетесь на проверку данных в ЕГРЮЛ/ЕГРИП и реестре самозанятых.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <LegalDocumentModal
          colors={colors}
          visible={openDoc !== null}
          onClose={() => setOpenDoc(null)}
          doc={openDoc ? partners.legalDocs[openDoc] : null}
        />
      </>
    );
  }

  // ============ CONTACTS REQUIRED ============
  if (partners.profile && partners.profile.approvalStatus === "contacts_required") {
    const pp = partners.profile;
    return (
      <>
        <Stack.Screen options={{ title: "Контактные данные", headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.white }} />
        <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.regContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.heroCard, { backgroundColor: colors.headerBg }]}>
              <View style={[styles.heroIcon, { backgroundColor: colors.teal + "30" }]}>
                <ShieldCheck size={36} color={colors.tealLight} />
              </View>
              <Text style={styles.heroTitle}>Шаг 2 · Контакты</Text>
              <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.75)" }]}>ФНС подтвердила {pp.legalName}. Заполните контактные данные — после проверки администратором вы получите доступ к кабинету.</Text>
            </View>

            <View style={[styles.regCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <View style={styles.regHeader}>
                <MessageCircle size={20} color={colors.teal} />
                <Text style={[styles.regHeaderText, { color: colors.text }]}>Контактные данные партнёра</Text>
              </View>
              <Text style={[styles.regDesc, { color: colors.textSecondary }]}>Эти данные нужны администратору для проверки и связи с вами.</Text>
              <TextInput
                style={[styles.regInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, letterSpacing: 0 }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={emailInput}
                onChangeText={(t) => { setEmailInput(t); setContactsError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="partner-email-input"
              />
              <TextInput
                style={[styles.regInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, marginTop: 10, letterSpacing: 0 }]}
                placeholder="Телефон (+7 ...)"
                placeholderTextColor={colors.textMuted}
                value={phoneInput}
                onChangeText={(t) => { setPhoneInput(t); setContactsError(null); }}
                keyboardType="phone-pad"
                testID="partner-phone-input"
              />
              <TextInput
                style={[styles.regInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, marginTop: 10, letterSpacing: 0 }]}
                placeholder="Telegram (никнейм без @)"
                placeholderTextColor={colors.textMuted}
                value={telegramInput}
                onChangeText={(t) => { setTelegramInput(t); setContactsError(null); }}
                autoCapitalize="none"
                testID="partner-telegram-input"
              />
              {contactsError ? (
                <View style={styles.errorRow}>
                  <AlertCircle size={14} color={colors.red} />
                  <Text style={[styles.errorText, { color: colors.red }]}>{contactsError}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.regSubmitBtn, { backgroundColor: colors.teal }]}
                onPress={submitContacts}
                activeOpacity={0.8}
                testID="partner-contacts-submit"
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.regSubmitText}>Отправить администратору</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => partners.logout()} style={{ marginTop: 12, alignSelf: "center" }}>
                <Text style={[styles.regNote, { color: colors.textMuted, textDecorationLine: "underline" }]}>Выйти и начать заново</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // ============ AWAITING APPROVAL ============
  if (partners.profile && partners.profile.approvalStatus === "pending_approval") {
    return (
      <>
        <Stack.Screen options={{ title: "Заявка на проверке", headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.white }} />
        <View style={[styles.flex, { backgroundColor: colors.background, padding: 20, justifyContent: "center" as const }]}>
          <View style={[styles.regCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, alignItems: "center" as const }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.gold + "22" }]}>
              <Clock size={36} color={colors.gold} />
            </View>
            <Text style={[styles.regHeaderText, { color: colors.text, textAlign: "center" as const, marginTop: 12 }]}>Заявка отправлена</Text>
            <Text style={[styles.regDesc, { color: colors.textSecondary, textAlign: "center" as const, marginTop: 8 }]}>
              Данные ФНС подтверждены, контактная информация принята. Администратор проверит ваш профиль и пришлёт письмо на {partners.profile.email}.
            </Text>
            <TouchableOpacity onPress={() => partners.logout()} style={[styles.regSubmitBtn, { backgroundColor: colors.surfaceSecondary, marginTop: 16 }]}>
              <LogOut size={16} color={colors.text} />
              <Text style={[styles.regSubmitText, { color: colors.text }]}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // ============ REJECTED ============
  if (partners.profile && partners.profile.approvalStatus === "rejected") {
    return (
      <>
        <Stack.Screen options={{ title: "Заявка отклонена", headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.white }} />
        <View style={[styles.flex, { backgroundColor: colors.background, padding: 20, justifyContent: "center" as const }]}>
          <View style={[styles.regCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, alignItems: "center" as const }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.red + "22" }]}>
              <XCircle size={36} color={colors.red} />
            </View>
            <Text style={[styles.regHeaderText, { color: colors.text, textAlign: "center" as const, marginTop: 12 }]}>Заявка отклонена</Text>
            {partners.profile.rejectionReason ? (
              <Text style={[styles.regDesc, { color: colors.textSecondary, textAlign: "center" as const, marginTop: 8 }]}>Причина: {partners.profile.rejectionReason}</Text>
            ) : null}
            <TouchableOpacity onPress={() => partners.logout()} style={[styles.regSubmitBtn, { backgroundColor: colors.teal, marginTop: 16 }]}>
              <Text style={styles.regSubmitText}>Начать заново</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // ============ DASHBOARD ============
  const p = partners.profile!;
  const filteredTransactions = partners.transactions; // table shows all; total uses period
  const periodTotal: number = period === "week" ? partners.stats.week : period === "month" ? partners.stats.month : period === "halfYear" ? partners.stats.halfYear : period === "year" ? partners.stats.year : partners.stats.all;

  const guestsByTour = (tourId: string) => partners.guests.filter((g) => g.tourId === tourId);
  const chatMessages = chatTourId ? partners.chat.filter((m) => m.tourId === chatTourId) : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.dashHeader, { backgroundColor: colors.headerBg, paddingTop: Platform.OS === "ios" ? 54 : 24 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.dashHeaderCenter}>
            <Text style={styles.dashHeaderTitle}>Кабинет партнёра</Text>
            <View style={styles.dashVerifiedRow}>
              <ShieldCheck size={11} color={colors.tealLight} />
              <Text style={[styles.dashVerifiedText, { color: colors.tealLight }]}>Подтверждён ФНС</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => partners.logout()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <LogOut size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileBlock, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <Text style={[styles.profileLegalName, { color: colors.text }]}>{p.legalName}</Text>
            <View style={styles.profileMetaRow}>
              <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>ИНН</Text>
              <Text style={[styles.profileMetaValue, { color: colors.text }]}>{p.inn}</Text>
            </View>
            {p.ogrn ? (
              <View style={styles.profileMetaRow}>
                <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>ОГРН</Text>
                <Text style={[styles.profileMetaValue, { color: colors.text }]}>{p.ogrn}</Text>
              </View>
            ) : null}
            <View style={styles.profileMetaRow}>
              <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>Тип</Text>
              <Text style={[styles.profileMetaValue, { color: colors.text }]}>{p.entityType === "company" ? "Юридическое лицо" : p.entityType === "ip" ? "Индивидуальный предприниматель" : "Самозанятый"}</Text>
            </View>
            <View style={styles.profileMetaRow}>
              <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>Адрес</Text>
              <Text style={[styles.profileMetaValue, { color: colors.text, flex: 1, textAlign: "right" }]} numberOfLines={2}>{p.address}</Text>
            </View>
          </View>

          {/* Rating block */}
          <View style={[styles.ratingBlock, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <View style={[styles.ratingIcon, { backgroundColor: colors.gold + "22" }]}>
              <Star size={22} color={colors.gold} fill={colors.gold} />
            </View>
            <View style={styles.ratingInfo}>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>Рейтинг партнёра</Text>
              <Text style={[styles.ratingSub, { color: colors.textMuted }]}>На основе отзывов клиентов</Text>
            </View>
            <View style={styles.ratingValueWrap}>
              <Text style={[styles.ratingValue, { color: colors.text }]}>{partners.partnerRating.count > 0 ? partners.partnerRating.average.toFixed(1) : "—"}</Text>
              <Text style={[styles.ratingCount, { color: colors.textMuted }]}>{partners.partnerRating.count} отз.</Text>
            </View>
          </View>

          {/* KPI cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Wallet size={18} color={colors.teal} />
              <Text style={[styles.kpiValue, { color: colors.text }]}>{periodTotal.toLocaleString()} ₽</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Оборот · {periodLabels[period].toLowerCase()}</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Users size={18} color={colors.gold} />
              <Text style={[styles.kpiValue, { color: colors.text }]}>{partners.guests.length}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Гостей всего</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <CheckCircle size={18} color={colors.green} />
              <Text style={[styles.kpiValue, { color: colors.text }]}>{partners.stats.published}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>В ленте</Text>
            </View>
          </View>

          {/* Period filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
            <View style={[styles.periodLabel, { backgroundColor: colors.surfaceSecondary }]}>
              <Filter size={12} color={colors.textMuted} />
              <Text style={[styles.periodLabelText, { color: colors.textMuted }]}>Период</Text>
            </View>
            {(Object.keys(periodLabels) as Period[]).map((k) => {
              const active = period === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setPeriod(k)}
                  style={[styles.periodChip, { backgroundColor: active ? colors.teal : colors.surface, borderColor: active ? colors.teal : colors.border }]}
                  activeOpacity={0.75}
                  testID={`period-${k}`}
                >
                  <Text style={[styles.periodChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>{periodLabels[k]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tabs */}
          <View style={[styles.tabsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(["tours", "guests", "transactions", "reviews", "chat"] as Tab[]).map((t) => {
              const active = activeTab === t;
              const label = t === "tours" ? "Туры" : t === "guests" ? "Клиенты" : t === "transactions" ? "Транзакции" : t === "reviews" ? "Отзывы" : "Чат";
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabBtn, active && { borderBottomColor: colors.teal }]}
                  onPress={() => setActiveTab(t)}
                  activeOpacity={0.75}
                  testID={`partner-tab-${t}`}
                >
                  <Text style={[styles.tabBtnText, { color: active ? colors.teal : colors.textMuted }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab content */}
          {activeTab === "tours" ? (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.teal }]}
                onPress={() => setShowAddForm((v) => !v)}
                activeOpacity={0.8}
                testID="partner-add-tour"
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{showAddForm ? "Скрыть форму" : "Добавить экскурсию"}</Text>
              </TouchableOpacity>

              {showAddForm ? (
                <View style={[styles.formCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                  <Text style={[styles.formTitle, { color: colors.text }]}>Новая экскурсия</Text>
                  <FormInput colors={colors} placeholder="Название" value={fTitle} onChangeText={setFTitle} />
                  <FormInput colors={colors} placeholder="Описание" value={fDesc} onChangeText={setFDesc} multiline />
                  <FormInput colors={colors} placeholder="Город" value={fCity} onChangeText={setFCity} />
                  <FormInput colors={colors} placeholder="Цена, ₽" value={fPrice} onChangeText={setFPrice} keyboardType="number-pad" />
                  <FormInput colors={colors} placeholder="Размер группы" value={fGroupSize} onChangeText={setFGroupSize} />
                  <FormInput colors={colors} placeholder="Место сбора" value={fMeeting} onChangeText={setFMeeting} />

                  <View style={styles.mediaSection}>
                    <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Фото и видео экскурсии</Text>
                    <View style={styles.mediaButtonsRow}>
                      <TouchableOpacity
                        style={[styles.mediaBtn, { backgroundColor: colors.tealSoft, borderColor: colors.teal }]}
                        onPress={() => pickMedia("image")}
                        activeOpacity={0.75}
                        testID="partner-pick-image"
                      >
                        <ImagePlus size={16} color={colors.teal} />
                        <Text style={[styles.mediaBtnText, { color: colors.teal }]}>Добавить фото</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mediaBtn, { backgroundColor: colors.gold + "22", borderColor: colors.gold }]}
                        onPress={() => pickMedia("video")}
                        activeOpacity={0.75}
                        testID="partner-pick-video"
                      >
                        <VideoIcon size={16} color={colors.gold} />
                        <Text style={[styles.mediaBtnText, { color: colors.gold }]}>Добавить видео</Text>
                      </TouchableOpacity>
                    </View>
                    {fMedia.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaPreviewRow}>
                        {fMedia.map((m) => (
                          <View key={m.uri} style={[styles.mediaThumb, { borderColor: colors.border }]}>
                            {m.type === "image" ? (
                              <Image source={{ uri: m.uri }} style={styles.mediaThumbImg} contentFit="cover" />
                            ) : (
                              <View style={[styles.mediaThumbImg, styles.mediaVideoPlaceholder, { backgroundColor: colors.headerBg }]}>
                                <Play size={22} color="#FFFFFF" />
                                <Text style={styles.mediaVideoLabel}>Видео</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.mediaRemoveBtn}
                              onPress={() => removeMedia(m.uri)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <XIcon size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={[styles.mediaHint, { color: colors.textMuted }]}>Первое фото станет обложкой экскурсии.</Text>
                    )}
                  </View>

                  <FormSelect colors={colors} label="Длительность" value={fDuration} options={[["one_day","Однодневная"],["multi_day","Многодневная"]]} onChange={(v) => setFDuration(v as DurationType)} />
                  <FormSelect colors={colors} label="Транспорт" value={fTransport} options={[["auto","Авто"],["water","Водный"],["sea","Морской"],["bike","Вело"],["air","Авиа"]]} onChange={(v) => setFTransport(v as TransportType)} />
                  <FormSelect colors={colors} label="Интерес" value={fInterest} options={[["city","Городские"],["educational","Познавательные"],["nature","Природные"],["pilgrimage","Паломничество"]]} onChange={(v) => setFInterest(v as InterestType)} />
                  <FormSelect colors={colors} label="Категория" value={fCategory ?? ""} options={[["","—"],["agro","Агро"],["photo","Фото"],["ethno","Этно"],["parents","С родителями"],["glamping","Глэмпинг"],["animals","С животными"],["mystic","Мистические"],["wild_animals","Дикие животные"],["wine","Винные"],["gastro","Гастро"]]} onChange={(v) => setFCategory(v === "" ? undefined : v as CategoryType)} />
                  <FormSelect colors={colors} label="Сезон" value={fSeason} options={[["all_year","Круглый год"],["winter","Зима"],["spring","Весна"],["summer","Лето"],["autumn","Осень"]]} onChange={(v) => setFSeason(v as SeasonType)} />

                  <TouchableOpacity style={[styles.submitFormBtn, { backgroundColor: colors.gold }]} onPress={submitNewTour} activeOpacity={0.8} testID="partner-submit-tour">
                    <Send size={16} color="#1B2838" />
                    <Text style={[styles.submitFormText, { color: "#1B2838" }]}>Отправить на модерацию</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {partners.tours.map((t) => (
                <TourRow key={t.id} tour={t} colors={colors} guestsCount={guestsByTour(t.id).length} onChat={() => { setChatTourId(t.id); setActiveTab("chat"); }} />
              ))}
            </View>
          ) : null}

          {activeTab === "guests" ? (
            <View style={styles.tabContent}>
              {partners.guests.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Пока нет участников</Text>
              ) : partners.guests.map((g) => {
                const tour = partners.tours.find((t) => t.id === g.tourId);
                return (
                  <View key={g.id} style={[styles.guestCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                    <View style={[styles.guestAvatar, { backgroundColor: colors.tealSoft }]}>
                      <Text style={[styles.guestInitials, { color: colors.teal }]}>{(g.firstName[0] ?? "") + (g.lastName[0] ?? "")}</Text>
                    </View>
                    <View style={styles.guestInfo}>
                      <Text style={[styles.guestName, { color: colors.text }]}>{`${g.firstName} ${g.lastName}`}</Text>
                      <Text style={[styles.guestSub, { color: colors.textMuted }]} numberOfLines={1}>{tour?.title ?? "—"}</Text>
                      <View style={styles.guestMetaRow}>
                        <Calendar size={11} color={colors.textMuted} />
                        <Text style={[styles.guestMeta, { color: colors.textMuted }]}>{g.tourDate}</Text>
                        <Text style={[styles.guestMeta, { color: colors.textMuted }]}>· {g.ticketCount} чел.</Text>
                      </View>
                    </View>
                    <View style={[styles.guestStatus, { backgroundColor: g.status === "upcoming" ? colors.tealSoft : g.status === "completed" ? colors.greenLight : "rgba(255,107,107,0.1)" }]}>
                      <Text style={[styles.guestStatusText, { color: g.status === "upcoming" ? colors.teal : g.status === "completed" ? colors.green : colors.red }]}>{g.status === "upcoming" ? "Предстоит" : g.status === "completed" ? "Прошёл" : "Отменён"}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {activeTab === "transactions" ? (
            <View style={styles.tabContent}>
              <View style={[styles.totalCard, { backgroundColor: colors.headerBg }]}>
                <Text style={styles.totalLabel}>Оборот за {periodLabels[period].toLowerCase()}</Text>
                <Text style={styles.totalValue}>{periodTotal.toLocaleString()} ₽</Text>
                <Text style={styles.totalSub}>Завершённых платежей: {partners.transactions.filter((t) => t.status === "completed").length}</Text>
              </View>
              {filteredTransactions.map((tr) => {
                const StatusIcon = tr.status === "completed" ? CheckCircle : tr.status === "pending" ? Clock : XCircle;
                const sc = tr.status === "completed" ? colors.green : tr.status === "pending" ? colors.orange : colors.red;
                return (
                  <View key={tr.id} style={[styles.txCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>{tr.tourTitle}</Text>
                      <Text style={[styles.txSub, { color: colors.textMuted }]}>{tr.guestName} · {tr.date}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: colors.text }]}>{tr.amount.toLocaleString()} {tr.currency}</Text>
                      <View style={styles.txStatusRow}>
                        <StatusIcon size={11} color={sc} />
                        <Text style={[styles.txStatusText, { color: sc }]}>{tr.status === "completed" ? "Зачислено" : tr.status === "pending" ? "В обработке" : "Возврат"}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {activeTab === "reviews" ? (
            <View style={styles.tabContent}>
              {partners.reviews.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Пока нет отзывов</Text>
              ) : partners.reviews.map((rv) => {
                const tour = partners.tours.find((t) => t.id === rv.tourId);
                const reply = rv.reply;
                const draft = replyDrafts[rv.id] ?? "";
                return (
                  <View key={rv.id} style={[styles.reviewCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewHeaderLeft}>
                        <Text style={[styles.reviewAuthor, { color: colors.text }]}>{rv.author}</Text>
                        <View style={styles.reviewStars}>
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} size={12} color={colors.gold} fill={i <= rv.rating ? colors.gold : "transparent"} />
                          ))}
                        </View>
                      </View>
                      <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{rv.createdAt}</Text>
                    </View>
                    {tour ? (
                      <Text style={[styles.reviewTourTitle, { color: colors.teal }]} numberOfLines={1}>{tour.title}</Text>
                    ) : null}
                    <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{rv.text}</Text>

                    {reply ? (
                      <View style={[styles.replyBox, { backgroundColor: reply.status === "approved" ? colors.tealSoft : reply.status === "pending" ? colors.gold + "15" : "rgba(231,76,60,0.10)", borderColor: reply.status === "approved" ? colors.teal : reply.status === "pending" ? colors.gold : colors.red }]}>
                        <View style={styles.replyHeader}>
                          <MessageSquare size={12} color={reply.status === "approved" ? colors.teal : reply.status === "pending" ? colors.gold : colors.red} />
                          <Text style={[styles.replyHeaderText, { color: reply.status === "approved" ? colors.teal : reply.status === "pending" ? colors.gold : colors.red }]}>
                            Ваш ответ · {reply.status === "approved" ? "Опубликован" : reply.status === "pending" ? "На модерации" : "Отклонён"}
                          </Text>
                        </View>
                        <Text style={[styles.replyText, { color: colors.text }]}>{reply.content}</Text>
                        {reply.status === "rejected" && reply.rejectionReason ? (
                          <Text style={[styles.replyReason, { color: colors.red }]}>Причина: {reply.rejectionReason}</Text>
                        ) : null}
                      </View>
                    ) : (
                      <View style={styles.replyForm}>
                        <TextInput
                          style={[styles.replyInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                          placeholder="Ответить на отзыв…"
                          placeholderTextColor={colors.textMuted}
                          value={draft}
                          onChangeText={(t) => setReplyDrafts((prev) => ({ ...prev, [rv.id]: t }))}
                          multiline
                        />
                        <TouchableOpacity
                          style={[styles.replySendBtn, { backgroundColor: colors.teal, opacity: draft.trim() ? 1 : 0.5 }]}
                          onPress={() => submitReply(rv.id)}
                          disabled={!draft.trim()}
                          testID={`reply-send-${rv.id}`}
                        >
                          <Send size={14} color="#FFFFFF" />
                          <Text style={styles.replySendBtnText}>На модерацию</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}

          {activeTab === "chat" ? (
            <View style={styles.tabContent}>
              <Text style={[styles.chatHint, { color: colors.textMuted }]}>Чат доступен клиентам, купившим тур. Администратор YAVOY автоматически подключается третьей стороной при поступлении сообщений.</Text>
              {!chatTourId ? (
                <View style={{ gap: 8 }}>
                  {partners.tours.map((t) => {
                    const lastMsg = [...partners.chat].reverse().find((m) => m.tourId === t.id);
                    return (
                      <TouchableOpacity key={t.id} style={[styles.chatRow, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]} onPress={() => setChatTourId(t.id)} activeOpacity={0.75}>
                        <Image source={{ uri: t.image }} style={styles.chatRowImage} contentFit="cover" />
                        <View style={styles.chatRowInfo}>
                          <Text style={[styles.chatRowTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                          <Text style={[styles.chatRowSub, { color: colors.textMuted }]} numberOfLines={1}>{lastMsg ? `${lastMsg.authorName}: ${lastMsg.content}` : "Нет сообщений"}</Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.chatPanel, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                  <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setChatTourId(null)}><ArrowLeft size={18} color={colors.text} /></TouchableOpacity>
                    <Text style={[styles.chatHeaderTitle, { color: colors.text }]} numberOfLines={1}>{partners.tours.find((t) => t.id === chatTourId)?.title}</Text>
                  </View>
                  <ScrollView style={styles.chatList} contentContainerStyle={{ padding: 12, gap: 8 }}>
                    {chatMessages.map((m) => {
                      const isMine = m.authorType === "partner";
                      const isAdmin = m.authorType === "admin";
                      return (
                        <View key={m.id} style={[styles.msgBubble, isMine ? { backgroundColor: colors.teal, alignSelf: "flex-end" } : isAdmin ? { backgroundColor: colors.gold + "22", alignSelf: "center", borderWidth: 1, borderColor: colors.gold + "55" } : { backgroundColor: colors.surfaceSecondary, alignSelf: "flex-start" }]}>
                          <Text style={[styles.msgAuthor, { color: isMine ? "rgba(255,255,255,0.8)" : isAdmin ? colors.gold : colors.textMuted }]}>{m.authorName}</Text>
                          <Text style={[styles.msgText, { color: isMine ? "#FFFFFF" : colors.text }]}>{m.content}</Text>
                          <Text style={[styles.msgTime, { color: isMine ? "rgba(255,255,255,0.7)" : colors.textMuted }]}>{m.createdAt}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <View style={[styles.chatInputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                    <TextInput
                      style={[styles.chatInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                      placeholder="Сообщение клиенту…"
                      placeholderTextColor={colors.textMuted}
                      value={chatInput}
                      onChangeText={setChatInput}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.chatSendBtn, { backgroundColor: colors.teal, opacity: chatInput.trim() ? 1 : 0.5 }]}
                      onPress={() => { if (chatTourId && chatInput.trim()) { partners.sendChatMessage(chatTourId, chatInput); setChatInput(""); } }}
                      disabled={!chatInput.trim()}
                    >
                      <Send size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

interface ColorsType {
  text: string; textMuted: string; textSecondary: string; teal: string; tealLight: string; tealSoft: string; gold: string; green: string; greenLight: string; orange: string; red: string; border: string; inputBg: string; surface: string; surfaceSecondary: string; cardShadow: string; background: string; headerBg: string; white: string;
}

interface FormInputProps {
  colors: ColorsType;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
}

function FormInput({ colors, placeholder, value, onChangeText, multiline, keyboardType }: FormInputProps) {
  return (
    <TextInput
      style={[styles.formInput, multiline && styles.formInputMulti, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType ?? "default"}
    />
  );
}

interface FormSelectProps {
  colors: ColorsType;
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}

function FormSelect({ colors, label, value, options, onChange }: FormSelectProps) {
  return (
    <View style={styles.selectWrap}>
      <Text style={[styles.selectLabel, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectRow}>
        {options.map(([v, l]) => {
          const active = value === v;
          return (
            <TouchableOpacity key={v || "_empty"} onPress={() => onChange(v)} style={[styles.selectChip, { backgroundColor: active ? colors.teal : colors.surfaceSecondary, borderColor: active ? colors.teal : colors.border }]} activeOpacity={0.75}>
              <Text style={[styles.selectChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>{l}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TourRowProps {
  tour: PartnerTourSubmission;
  colors: ColorsType;
  guestsCount: number;
  onChat: () => void;
}

function TourRow({ tour, colors, guestsCount, onChat }: TourRowProps) {
  const statusCfg = useMemo(() => {
    if (tour.status === "published") return { label: "Опубликован", color: colors.green, bg: colors.greenLight, Icon: CheckCircle };
    if (tour.status === "pending") return { label: "На модерации", color: colors.orange, bg: "rgba(243,156,18,0.12)", Icon: Clock };
    return { label: "Отклонён", color: colors.red, bg: "rgba(231,76,60,0.12)", Icon: XCircle };
  }, [tour.status, colors]);
  const StatusIcon = statusCfg.Icon;
  return (
    <View style={[styles.tourCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <Image source={{ uri: tour.image }} style={styles.tourImage} contentFit="cover" />
      <View style={styles.tourInfo}>
        <Text style={[styles.tourTitle, { color: colors.text }]} numberOfLines={2}>{tour.title}</Text>
        <Text style={[styles.tourMeta, { color: colors.textMuted }]}>{tour.city} · {tour.price.toLocaleString()} {tour.currency}</Text>
        <View style={styles.tourFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <StatusIcon size={11} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
          <View style={[styles.tourGuests, { backgroundColor: colors.tealSoft }]}>
            <Users size={11} color={colors.teal} />
            <Text style={[styles.tourGuestsText, { color: colors.teal }]}>{guestsCount}</Text>
          </View>
          <TouchableOpacity onPress={onChat} style={[styles.tourChatBtn, { backgroundColor: colors.gold + "20" }]} activeOpacity={0.75}>
            <MessageCircle size={11} color={colors.gold} />
            <Text style={[styles.tourChatText, { color: colors.gold }]}>Чат</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  regContent: { padding: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 20, padding: 22, alignItems: "center" as const, marginBottom: 16 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 14 },
  heroTitle: { fontSize: 20, fontWeight: "800" as const, color: "#FFFFFF", textAlign: "center" as const, marginBottom: 8 },
  heroSub: { fontSize: 13, textAlign: "center" as const, lineHeight: 19 },
  heroBenefitsRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, marginTop: 16, justifyContent: "center" as const },
  heroBenefit: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  heroBenefitText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" as const },
  regCard: { borderRadius: 18, padding: 18, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  regHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 8 },
  regHeaderText: { fontSize: 16, fontWeight: "700" as const },
  regDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  regInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, letterSpacing: 1 },
  errorRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 8 },
  errorText: { fontSize: 12, fontWeight: "600" as const, flex: 1 },
  regSubmitBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
  regSubmitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  regNote: { fontSize: 11, textAlign: "center" as const, marginTop: 12, lineHeight: 16 },

  dashHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  dashHeaderCenter: { flex: 1, alignItems: "center" as const },
  dashHeaderTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  dashVerifiedRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: 2 },
  dashVerifiedText: { fontSize: 10, fontWeight: "600" as const },
  dashContent: { paddingBottom: 30 },

  profileBlock: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  profileLegalName: { fontSize: 16, fontWeight: "700" as const, marginBottom: 12 },
  profileMetaRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingVertical: 4 },
  profileMetaLabel: { fontSize: 12 },
  profileMetaValue: { fontSize: 13, fontWeight: "600" as const, marginLeft: 12 },

  kpiRow: { flexDirection: "row" as const, gap: 10, paddingHorizontal: 16, marginTop: 14 },
  kpiCard: { flex: 1, borderRadius: 14, padding: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  kpiValue: { fontSize: 16, fontWeight: "800" as const, marginTop: 6 },
  kpiLabel: { fontSize: 10, marginTop: 2 },

  periodRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12, alignItems: "center" as const },
  periodLabel: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 },
  periodLabelText: { fontSize: 11, fontWeight: "600" as const },
  periodChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  periodChipText: { fontSize: 12, fontWeight: "600" as const },

  tabsBar: { flexDirection: "row" as const, marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" as const, marginTop: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" as const, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnText: { fontSize: 12, fontWeight: "700" as const },
  tabContent: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  addBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 13, borderRadius: 12 },
  addBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },

  formCard: { borderRadius: 14, padding: 14, gap: 8, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  formTitle: { fontSize: 15, fontWeight: "700" as const, marginBottom: 4 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  formInputMulti: { minHeight: 70, textAlignVertical: "top" as const },
  selectWrap: { marginTop: 4 },
  selectLabel: { fontSize: 11, fontWeight: "600" as const, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  selectRow: { gap: 6, paddingRight: 12 },
  selectChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  selectChipText: { fontSize: 12, fontWeight: "600" as const },
  mediaSection: { marginTop: 6, gap: 8 },
  mediaButtonsRow: { flexDirection: "row" as const, gap: 8 },
  mediaBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  mediaBtnText: { fontSize: 12, fontWeight: "700" as const },
  mediaHint: { fontSize: 11, fontStyle: "italic" as const },
  mediaPreviewRow: { gap: 8, paddingTop: 4, paddingRight: 8 },
  mediaThumb: { width: 86, height: 86, borderRadius: 10, borderWidth: 1, overflow: "hidden" as const, position: "relative" as const },
  mediaThumbImg: { width: 86, height: 86 },
  mediaVideoPlaceholder: { alignItems: "center" as const, justifyContent: "center" as const, gap: 4 },
  mediaVideoLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" as const },
  mediaRemoveBtn: { position: "absolute" as const, top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center" as const, justifyContent: "center" as const },
  submitFormBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 13, borderRadius: 12, marginTop: 8 },
  submitFormText: { fontSize: 14, fontWeight: "700" as const },

  tourCard: { flexDirection: "row" as const, gap: 12, borderRadius: 14, padding: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tourImage: { width: 86, height: 86, borderRadius: 10 },
  tourInfo: { flex: 1 },
  tourTitle: { fontSize: 14, fontWeight: "700" as const, lineHeight: 19 },
  tourMeta: { fontSize: 12, marginTop: 3 },
  tourFooter: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 8, flexWrap: "wrap" as const },
  statusBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" as const },
  tourGuests: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tourGuestsText: { fontSize: 10, fontWeight: "700" as const },
  tourChatBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tourChatText: { fontSize: 10, fontWeight: "700" as const },

  emptyText: { textAlign: "center" as const, fontSize: 13, paddingVertical: 24 },

  guestCard: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, borderRadius: 12, padding: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  guestAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center" as const, justifyContent: "center" as const },
  guestInitials: { fontSize: 14, fontWeight: "800" as const },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 14, fontWeight: "700" as const },
  guestSub: { fontSize: 12, marginTop: 1 },
  guestMetaRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: 3 },
  guestMeta: { fontSize: 11 },
  guestStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  guestStatusText: { fontSize: 10, fontWeight: "700" as const },

  totalCard: { borderRadius: 16, padding: 18, marginBottom: 6 },
  totalLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  totalValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" as const, marginTop: 4 },
  totalSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 },

  txCard: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, borderRadius: 12, padding: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: "700" as const },
  txSub: { fontSize: 11, marginTop: 2 },
  txRight: { alignItems: "flex-end" as const },
  txAmount: { fontSize: 14, fontWeight: "800" as const },
  txStatusRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3, marginTop: 3 },
  txStatusText: { fontSize: 10, fontWeight: "700" as const },

  chatHint: { fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },
  chatRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, borderRadius: 12, padding: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  chatRowImage: { width: 52, height: 52, borderRadius: 10 },
  chatRowInfo: { flex: 1 },
  chatRowTitle: { fontSize: 14, fontWeight: "700" as const },
  chatRowSub: { fontSize: 12, marginTop: 2 },

  chatPanel: { borderRadius: 14, minHeight: 480, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: "hidden" as const },
  chatHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 14, fontWeight: "700" as const, flex: 1 },
  chatList: { maxHeight: 380 },
  msgBubble: { maxWidth: "80%" as const, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  msgAuthor: { fontSize: 10, fontWeight: "700" as const, marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTime: { fontSize: 9, marginTop: 4 },
  chatInputRow: { flexDirection: "row" as const, gap: 8, padding: 10, borderTopWidth: 1, alignItems: "flex-end" as const },
  chatInput: { flex: 1, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center" as const, justifyContent: "center" as const },

  legalBlock: { marginTop: 14, gap: 10 },
  legalRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 10 },
  legalCheckbox: { width: 22, height: 22, borderRadius: 6, alignItems: "center" as const, justifyContent: "center" as const, marginTop: 1 },
  legalTextWrap: { flex: 1, flexDirection: "row" as const, flexWrap: "wrap" as const, alignItems: "center" as const },
  legalText: { fontSize: 12, lineHeight: 18 },
  legalLink: { fontSize: 12, fontWeight: "700" as const, textDecorationLine: "underline" as const, lineHeight: 18 },

  docModalOverlay: { flex: 1, justifyContent: "center" as const, padding: 16 },
  docModalBackdrop: { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" },
  docModalCard: { borderRadius: 18, height: "86%" as const, overflow: "hidden" as const, flexDirection: "column" as const },
  docModalScroll: { flex: 1 },
  docModalHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  docModalIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  docModalTitle: { fontSize: 14, fontWeight: "800" as const, flex: 1 },
  docModalClose: { width: 32, height: 32, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  docModalBody: { padding: 16 },
  docModalText: { fontSize: 13, lineHeight: 20 },
  docModalFooter: { padding: 14, borderTopWidth: 1, alignItems: "center" as const },
  docModalFooterBtn: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12 },
  docModalFooterText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" as const },

  ratingBlock: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  ratingIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
  ratingInfo: { flex: 1 },
  ratingTitle: { fontSize: 14, fontWeight: "700" as const },
  ratingSub: { fontSize: 11, marginTop: 2 },
  ratingValueWrap: { alignItems: "flex-end" as const },
  ratingValue: { fontSize: 22, fontWeight: "800" as const },
  ratingCount: { fontSize: 11, marginTop: 1 },

  reviewCard: { borderRadius: 14, padding: 14, gap: 8, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  reviewHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  reviewHeaderLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  reviewAuthor: { fontSize: 14, fontWeight: "700" as const },
  reviewStars: { flexDirection: "row" as const, gap: 2 },
  reviewDate: { fontSize: 11 },
  reviewTourTitle: { fontSize: 12, fontWeight: "600" as const },
  reviewText: { fontSize: 13, lineHeight: 19 },
  replyBox: { borderRadius: 12, padding: 10, borderWidth: 1, gap: 4, marginTop: 4 },
  replyHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 },
  replyHeaderText: { fontSize: 11, fontWeight: "700" as const },
  replyText: { fontSize: 13, lineHeight: 18 },
  replyReason: { fontSize: 11, marginTop: 4, fontStyle: "italic" as const },
  replyForm: { marginTop: 6, gap: 8 },
  replyInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, minHeight: 60, textAlignVertical: "top" as const },
  replySendBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 10 },
  replySendBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" as const },
});

interface LegalCheckboxProps {
  colors: ColorsType;
  checked: boolean;
  onToggle: () => void;
  onOpenDoc: () => void;
  label: string;
  testID?: string;
}

function LegalCheckbox({ colors, checked, onToggle, onOpenDoc, label, testID }: LegalCheckboxProps) {
  return (
    <View style={styles.legalRow}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={[styles.legalCheckbox, { backgroundColor: checked ? colors.teal : "transparent", borderWidth: 1.5, borderColor: checked ? colors.teal : colors.border }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={testID}
      >
        {checked ? <Check size={14} color="#FFFFFF" /> : null}
      </TouchableOpacity>
      <Text style={[styles.legalText, { color: colors.textSecondary }]}>
        Я ознакомлен и соглашаюсь с{" "}
        <Text style={[styles.legalLink, { color: colors.teal }]} onPress={onOpenDoc}>
          {label}
        </Text>
      </Text>
    </View>
  );
}

interface LegalDocumentModalProps {
  colors: ColorsType;
  visible: boolean;
  onClose: () => void;
  doc: { title: string; body: string } | null;
}

function LegalDocumentModal({ colors, visible, onClose, doc }: LegalDocumentModalProps) {
  if (!doc) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.docModalOverlay}>
        <Pressable style={styles.docModalBackdrop} onPress={onClose} />
        <View style={[styles.docModalCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.docModalHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.docModalIcon, { backgroundColor: colors.tealSoft }]}>
              <FileText size={16} color={colors.teal} />
            </View>
            <Text style={[styles.docModalTitle, { color: colors.text }]} numberOfLines={2}>{doc.title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.docModalClose, { backgroundColor: colors.surfaceSecondary }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.docModalScroll} contentContainerStyle={styles.docModalBody} showsVerticalScrollIndicator nestedScrollEnabled>
            <Text style={[styles.docModalText, { color: colors.textSecondary }]}>{doc.body}</Text>
          </ScrollView>
          <View style={[styles.docModalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={[styles.docModalFooterBtn, { backgroundColor: colors.teal }]}>
              <Text style={styles.docModalFooterText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

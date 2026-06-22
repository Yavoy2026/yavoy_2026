import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Share,
  Platform,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Heart,
  Ticket,
  Receipt,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  CircleHelp as HelpCircle,
  Bell,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Sun,
  Moon,
  Smartphone,
  Check,
  Star as StarIcon2,
  MessageSquare,
  FileText,
  Info,
  X,
  Gift,
  Share2,
  Award,
  Coins,
  Copy,
  Plane,
  Wallet,
  ExternalLink,
  Video,
  Upload,
  ShieldCheck,
  Headphones,
  Building2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { BellRing, BellOff, Tag, Star as StarIcon, Navigation, Megaphone } from "lucide-react-native";
import { useTheme, ThemeMode } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getPhotoUrl } from "@/services/api";
import { useFavorites } from "@/providers/FavoritesProvider";
import { useBookings } from "@/providers/BookingsProvider";
import { useLoyalty } from "@/providers/LoyaltyProvider";
import { useCertificates } from "@/providers/CertificatesProvider";
import { usePromoCodes } from "@/providers/PromoCodesProvider";
import { useReels } from "@/providers/ReelsProvider";
import { tours, purchasedTours, transactions } from "@/mocks/tours";
import { cityNameMap } from "@/mocks/cities";
import { BookedTour, GiftCertificate } from "@/types/tour";
import CertificateModal from "@/components/CertificateModal";

type SectionType = "favorites" | "purchased" | "transactions" | "reviews" | "myBookings" | "certificates" | "promos" | "reels" | null;

interface NotificationSettings {
  allEnabled: boolean;
  newTours: boolean;
  priceDrops: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
}

const NOTIF_STORAGE_KEY = "yavoy_notification_settings";
const DEFAULT_NOTIF: NotificationSettings = {
  allEnabled: true,
  newTours: true,
  priceDrops: true,
  bookingUpdates: true,
  promotions: false,
};

const themeOptions: { key: ThemeMode; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: "system", label: "Системная", icon: Smartphone },
  { key: "light", label: "Светлая", icon: Sun },
  { key: "dark", label: "Тёмная", icon: Moon },
];

interface UserReview {
  id: string;
  tourTitle: string;
  tourImage: string;
  rating: number;
  text: string;
  date: string;
}

const userReviews: UserReview[] = [
  {
    id: "ur1",
    tourTitle: "Обзорная экскурсия по Москве",
    tourImage: tours[0].image,
    rating: 5,
    text: "Потрясающая экскурсия! Гид был очень увлечённым, узнал много нового о столице.",
    date: "2026-03-20",
  },
  {
    id: "ur2",
    tourTitle: "Белые ночи Петербурга",
    tourImage: tours[2].image,
    rating: 5,
    text: "Волшебная атмосфера белых ночей! Разводные мосты — невероятное зрелище.",
    date: "2026-02-18",
  },
  {
    id: "ur3",
    tourTitle: "Горный маршрут Красная Поляна",
    tourImage: tours[3].image,
    rating: 4,
    text: "Отличный маршрут, но хотелось бы больше остановок для фото.",
    date: "2026-01-15",
  },
];

const TERMS_CONTENT = `Условия использования сервиса YAVOY

1. Общие положения
1.1. Настоящие Условия использования регулируют порядок пользования мобильным приложением YAVOY (далее — «Приложение»), разработанным и управляемым компанией YaVoy Travel Group (далее — «Компания»).
1.2. Используя Приложение, вы подтверждаете своё согласие с настоящими Условиями.

2. Описание сервиса
2.1. YAVOY — агрегатор туристических экскурсий и маршрутов, предоставляющий пользователям возможность поиска, бронирования и оплаты экскурсионных услуг.
2.2. Компания не является организатором экскурсий, а выступает посредником между пользователями и организаторами.

3. Регистрация и аккаунт
3.1. Для бронирования экскурсий необходимо указать контактные данные: телефон или email, имя и фамилию.
3.2. Пользователь несёт ответственность за достоверность предоставленных данных.

4. Бронирование и оплата
4.1. Условия бронирования, предоплаты и отмены определяются организатором каждой конкретной экскурсии и указаны в карточке тура.
4.2. Оплата производится через защищённые платёжные системы.
4.3. Компания не несёт ответственности за качество услуг, предоставляемых организаторами.

5. Отмена и возврат
5.1. Условия отмены и возврата средств определяются политикой каждого конкретного организатора.
5.2. Возврат средств осуществляется тем же способом, которым была произведена оплата.

6. Интеллектуальная собственность
6.1. Все материалы Приложения, включая тексты, изображения, дизайн и логотипы, являются собственностью Компании.

7. Ограничение ответственности
7.1. Компания не гарантирует бесперебойную работу Приложения.
7.2. Компания не несёт ответственности за действия третьих лиц и организаторов экскурсий.

8. Изменения условий
8.1. Компания вправе изменять настоящие Условия в одностороннем порядке с уведомлением пользователей.

Дата последнего обновления: 1 апреля 2026 г.`;

const ABOUT_CONTENT = `О компании YAVOY Travel Group

YAVOY Travel Group — это современный агрегатор туристических экскурсий и маршрутов по России. Мы объединяем лучших гидов и организаторов, чтобы вы могли легко находить и бронировать уникальные экскурсии в любом городе страны.

Наша миссия
Сделать путешествия по России доступными, удобными и незабываемыми для каждого. Мы верим, что каждый город хранит свои секреты, и наша задача — помочь вам их раскрыть.

Что мы предлагаем
• Более 500 экскурсий в 50+ городах России
• Проверенные организаторы с рейтинговой системой
• Мгновенное бронирование и безопасная оплата
• Бесплатная отмена на большинство экскурсий
• Поддержка 24/7

Наша команда
Команда YAVOY — это увлечённые путешественники и IT-специалисты, которые создали платформу, объединяющую технологии и любовь к путешествиям. Мы тщательно отбираем каждого организатора и следим за качеством предоставляемых услуг.

Контакты
Email: info@yavoy.ru
Телефон: +7 (800) 555-00-00 (бесплатно по России)
Адрес: Москва, ул. Тверская, 1

Социальные сети
• Telegram: @yavoy_travel
• ВКонтакте: vk.com/yavoy

ООО «ЯВой Тревел Груп»
ИНН: 7707123456
ОГРН: 1027700123456

Дата основания: 2024 г.`;

const APP_VERSION = "2.1.0";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, themeMode, setTheme } = useTheme();
  const auth = useAuth();
  const { favoriteIds } = useFavorites();
  const { bookings, upcomingBookings, completedBookings } = useBookings();
  const { points, addPromoPoints } = useLoyalty();
  const { certificates } = useCertificates();
  const { promoCodes, generateNewPromo } = usePromoCodes();
  const { moderationReels, submitReel, rewardPoints } = useReels();
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);
  const [showThemeSettings, setShowThemeSettings] = useState<boolean>(false);
  const [showNotifSettings, setShowNotifSettings] = useState<boolean>(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF);
  const [termsModalVisible, setTermsModalVisible] = useState<boolean>(false);
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);
  const [voucherBooking, setVoucherBooking] = useState<BookedTour | null>(null);
  const [voucherCert, setVoucherCert] = useState<GiftCertificate | null>(null);
  const [reelTitle, setReelTitle] = useState<string>("");
  const [reelTourTitle, setReelTourTitle] = useState<string>("");
  const [reelCity, setReelCity] = useState<string>("");
  const [pickedVideoUri, setPickedVideoUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setNotifSettings(JSON.parse(val));
          console.log("[ProfileScreen] Loaded notification settings");
        } catch (e) {
          console.log("[ProfileScreen] Failed to parse notification settings");
        }
      }
    });
  }, []);

  const updateNotifSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setNotifSettings((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "allEnabled" && !value) {
        updated.newTours = false;
        updated.priceDrops = false;
        updated.bookingUpdates = false;
        updated.promotions = false;
      } else if (key === "allEnabled" && value) {
        updated.newTours = true;
        updated.priceDrops = true;
        updated.bookingUpdates = true;
        updated.promotions = false;
      }
      AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      console.log("[ProfileScreen] Saved notification settings:", updated);
      return updated;
    });
  }, []);
  const favoriteTours = tours.filter((t) => favoriteIds.includes(t.id));

  const pickReelVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPickedVideoUri(result.assets[0]?.uri);
      console.log("[ProfileScreen] Reel video selected");
    }
  }, []);

  const handleSubmitReel = useCallback(() => {
    const { reward } = submitReel({
      title: reelTitle,
      tourTitle: reelTourTitle,
      city: reelCity,
      videoUri: pickedVideoUri,
    });
    addPromoPoints(reward);
    setReelTitle("");
    setReelTourTitle("");
    setReelCity("");
    setPickedVideoUri(undefined);
    Alert.alert("Reels отправлен", `Видео отправлено администратору на модерацию. На бонусный счёт начислено ${reward} баллов за добавление reels.`);
  }, [submitReel, addPromoPoints, reelTitle, reelTourTitle, reelCity, pickedVideoUri]);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
    completed: { label: "Оплачено", color: colors.green, icon: CheckCircle },
    pending: { label: "В обработке", color: colors.orange, icon: Clock },
    refunded: { label: "Возврат", color: colors.red, icon: XCircle },
  };

  const bookingStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    upcoming: { label: "Предстоит", color: colors.teal, bgColor: colors.tealSoft },
    completed: { label: "Завершён", color: colors.green, bgColor: colors.greenLight },
    cancelled: { label: "Отменён", color: colors.red, bgColor: "rgba(255,107,107,0.1)" },
  };

  console.log("[ProfileScreen] Rendering with", favoriteIds.length, "favorites");

  const toggleSection = useCallback((section: SectionType) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const navigateToTour = useCallback((tourId: string) => {
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourId } });
  }, [router]);

  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} size={12} color={i < rating ? colors.gold : colors.gray300} fill={i < rating ? colors.gold : "transparent"} />
    ));
  }, [colors]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.avatarContainer, { borderColor: colors.teal }]}>
          <Image
            source={{
              uri: auth.user?.photo
                ? getPhotoUrl(auth.user.photo)
                : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
            }}
            style={styles.avatar}
            contentFit="cover"
          />
          {auth.isAuthenticated && (
            <View style={[styles.avatarBadge, { backgroundColor: colors.green, borderColor: colors.headerBg }]} />
          )}
        </View>
        <Text style={styles.userName}>
          {auth.isAuthenticated
            ? `${auth.user?.first_name ?? ""} ${auth.user?.last_name ?? ""}`.trim() || "Пользователь"
            : "Гость"}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>
          {auth.isAuthenticated ? auth.user?.email ?? "" : "Войдите, чтобы открыть все возможности"}
        </Text>

        <View style={[styles.statsRow, { backgroundColor: colors.navyLight }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.tealLight }]}>{String(bookings.length + purchasedTours.length)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{"Поездки"}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray300 + "30" }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.gold }]}>{String(points)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{"Баллы"}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray300 + "30" }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.tealLight }]}>{String(favoriteIds.length)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{"Избранное"}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionsContainer, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("myBookings")}
          activeOpacity={0.7}
          testID="section-my-bookings"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.tealSoft }]}>
              <Plane size={20} color={colors.teal} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Мои поездки"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${bookings.length + purchasedTours.length} поездок · ${upcomingBookings.length} предстоит`}</Text>
            </View>
          </View>
          {expandedSection === "myBookings" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "myBookings" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            {bookings.length === 0 && purchasedTours.length === 0 ? (
              <Text style={[styles.emptySection, { color: colors.textMuted }]}>{"Нет поездок"}</Text>
            ) : (
              <>
                {bookings.map((bk) => {
                  const isUpcoming = bk.status === "upcoming";
                  return (
                    <View key={bk.id} style={[styles.purchasedCard, { backgroundColor: colors.surface }]}>
                      <Image source={{ uri: bk.tourImage }} style={styles.purchasedImage} contentFit="cover" />
                      <View style={styles.purchasedInfo}>
                        <Text style={[styles.purchasedTitle, { color: colors.text }]} numberOfLines={1}>{bk.tourTitle}</Text>
                        <View style={styles.purchasedMeta}>
                          <Calendar size={12} color={colors.textMuted} />
                          <Text style={[styles.purchasedDate, { color: colors.textMuted }]}>{bk.tourDate}</Text>
                          <Text style={[styles.purchasedTickets, { color: colors.textMuted }]}>{`· ${bk.tourStartTime}`}</Text>
                        </View>
                        <View style={styles.purchasedBottom}>
                          <View style={[styles.statusPill, { backgroundColor: isUpcoming ? colors.tealSoft : colors.greenLight }]}>
                            <Text style={[styles.statusPillText, { color: isUpcoming ? colors.teal : colors.green }]}>{isUpcoming ? "Предстоит" : "Завершено"}</Text>
                          </View>
                          <TouchableOpacity onPress={() => setVoucherBooking(bk)} activeOpacity={0.7}>
                            <Text style={[styles.voucherLink, { color: colors.teal }]}>{"Ваучер"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {purchasedTours.map((pt) => {
                  const statusInfo = bookingStatusConfig[pt.status] || bookingStatusConfig.upcoming;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[styles.purchasedCard, { backgroundColor: colors.surface }]}
                      onPress={() => navigateToTour(pt.tour.id)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: pt.tour.image }} style={styles.purchasedImage} contentFit="cover" />
                      <View style={styles.purchasedInfo}>
                        <Text style={[styles.purchasedTitle, { color: colors.text }]} numberOfLines={1}>{pt.tour.title}</Text>
                        <View style={styles.purchasedMeta}>
                          <Calendar size={12} color={colors.textMuted} />
                          <Text style={[styles.purchasedDate, { color: colors.textMuted }]}>{pt.tourDate}</Text>
                          <Text style={[styles.purchasedTickets, { color: colors.textMuted }]}>{`\u00B7 ${pt.ticketCount} чел.`}</Text>
                        </View>
                        <View style={styles.purchasedBottom}>
                          <View style={[styles.statusPill, { backgroundColor: statusInfo.bgColor }]}>
                            <Text style={[styles.statusPillText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                          </View>
                          <Text style={[styles.confirmCode, { color: colors.textMuted }]}>{pt.confirmationCode}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("favorites")}
          activeOpacity={0.7}
          testID="section-favorites"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(255,107,107,0.1)" }]}>
              <Heart size={20} color={colors.coral} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Избранные туры"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${favoriteTours.length} экскурсий`}</Text>
            </View>
          </View>
          {expandedSection === "favorites" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "favorites" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            {favoriteTours.length === 0 ? (
              <Text style={[styles.emptySection, { color: colors.textMuted }]}>{"Нет избранных экскурсий"}</Text>
            ) : (
              favoriteTours.map((tour) => (
                <TouchableOpacity
                  key={tour.id}
                  style={[styles.miniCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigateToTour(tour.id)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: tour.image }} style={styles.miniImage} contentFit="cover" />
                  <View style={styles.miniInfo}>
                    <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>{tour.title}</Text>
                    <View style={styles.miniLocationRow}>
                      <MapPin size={11} color={colors.textMuted} />
                      <Text style={[styles.miniLocation, { color: colors.textMuted }]}>{cityNameMap[tour.city] || tour.city}</Text>
                    </View>
                    <Text style={[styles.miniPrice, { color: colors.teal }]}>{`${tour.price.toLocaleString()}${tour.currency}`}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}



        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("reviews")}
          activeOpacity={0.7}
          testID="section-reviews"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(232,185,49,0.1)" }]}>
              <MessageSquare size={20} color={colors.gold} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Мои отзывы"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${userReviews.length} отзывов`}</Text>
            </View>
          </View>
          {expandedSection === "reviews" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "reviews" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            {userReviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                <View style={styles.reviewTop}>
                  <Image source={{ uri: review.tourImage }} style={styles.reviewImage} contentFit="cover" />
                  <View style={styles.reviewInfo}>
                    <Text style={[styles.reviewTourTitle, { color: colors.text }]} numberOfLines={1}>{review.tourTitle}</Text>
                    <View style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </View>
                    <Text style={[styles.reviewDateText, { color: colors.textMuted }]}>{review.date}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{review.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("certificates")}
          activeOpacity={0.7}
          testID="section-certificates"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(232,185,49,0.1)" }]}>
              <Gift size={20} color={colors.gold} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Мои сертификаты"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${certificates.length} сертификатов`}</Text>
            </View>
          </View>
          {expandedSection === "certificates" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "certificates" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            {certificates.length === 0 ? (
              <View>
                <Text style={[styles.emptySection, { color: colors.textMuted }]}>{"Нет сертификатов"}</Text>
                <TouchableOpacity
                  style={[styles.buyNewBtn, { backgroundColor: colors.teal }]}
                  onPress={() => setCertModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Gift size={14} color="#FFFFFF" />
                  <Text style={styles.buyNewBtnText}>{"Купить сертификат"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {certificates.map((cert) => (
                  <TouchableOpacity
                    key={cert.id}
                    style={[styles.certCard, { backgroundColor: colors.surface }]}
                    onPress={() => setVoucherCert(cert)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.certIcon, { backgroundColor: colors.gold + "20" }]}>
                      <Gift size={18} color={colors.gold} />
                    </View>
                    <View style={styles.certInfo}>
                      <Text style={[styles.certNominal, { color: colors.text }]}>{`${cert.nominal.toLocaleString()} ${cert.currency}`}</Text>
                      <Text style={[styles.certTo, { color: colors.textMuted }]}>{`Для: ${cert.toName}`}</Text>
                    </View>
                    <Text style={[styles.certCode, { color: colors.textMuted }]}>{cert.code}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.buyNewBtn, { backgroundColor: colors.teal }]}
                  onPress={() => setCertModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Gift size={14} color="#FFFFFF" />
                  <Text style={styles.buyNewBtnText}>{"Купить ещё"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("promos")}
          activeOpacity={0.7}
          testID="section-promos"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.greenLight }]}>
              <Share2 size={20} color={colors.green} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Мои промокоды"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${promoCodes.length} промокодов · 2000 баллов за друга`}</Text>
            </View>
          </View>
          {expandedSection === "promos" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "promos" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.promoInfo, { backgroundColor: colors.tealSoft, borderColor: colors.teal + "30" }]}>
              <Award size={16} color={colors.teal} />
              <Text style={[styles.promoInfoText, { color: colors.teal }]}>{"Пригласите друга и получите 2000 баллов за каждый активированный промокод!"}</Text>
            </View>
            {promoCodes.map((promo) => (
              <View key={promo.id} style={[styles.promoCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.promoCodeBadge, { backgroundColor: colors.navy }]}>
                  <Text style={styles.promoCodeText}>{promo.code}</Text>
                </View>
                <View style={styles.promoMeta}>
                  <Text style={[styles.promoDate, { color: colors.textMuted }]}>{`Создан: ${promo.createdAt}`}</Text>
                  <Text style={[styles.promoActivations, { color: colors.textSecondary }]}>{`Активаций: ${promo.activatedBy.length}`}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.buyNewBtn, { backgroundColor: colors.teal }]}
              onPress={() => generateNewPromo()}
              activeOpacity={0.7}
            >
              <Copy size={14} color="#FFFFFF" />
              <Text style={styles.buyNewBtnText}>{"Создать промокод"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("reels")}
          activeOpacity={0.7}
          testID="section-reels"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.coral + "20" }]}> 
              <Video size={20} color={colors.coral} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Мои Reels"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${moderationReels.length} на модерации · +${rewardPoints} баллов за публикацию`}</Text>
            </View>
          </View>
          {expandedSection === "reels" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "reels" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}> 
            <View style={[styles.reelsRewardBox, { backgroundColor: colors.tealSoft, borderColor: colors.teal + "30" }]}> 
              <Coins size={16} color={colors.teal} />
              <Text style={[styles.reelsRewardText, { color: colors.teal }]}>{`За добавление reels начисляется ${rewardPoints} баллов. Видео появится в ленте после модерации администратором.`}</Text>
            </View>
            <TouchableOpacity style={[styles.videoPickCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickReelVideo} activeOpacity={0.75}>
              <View style={[styles.videoPickIcon, { backgroundColor: colors.coral + "20" }]}> 
                <Upload size={18} color={colors.coral} />
              </View>
              <View style={styles.videoPickTextWrap}>
                <Text style={[styles.videoPickTitle, { color: colors.text }]}>{pickedVideoUri ? "Видео выбрано" : "Добавить видео"}</Text>
                <Text style={[styles.videoPickSub, { color: colors.textMuted }]}>{pickedVideoUri ? "Готово к отправке на модерацию" : "Выберите короткий ролик из галереи"}</Text>
              </View>
            </TouchableOpacity>
            <TextInput style={[styles.reelInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Название reels" placeholderTextColor={colors.textMuted} value={reelTitle} onChangeText={setReelTitle} />
            <TextInput style={[styles.reelInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Название экскурсии или тура" placeholderTextColor={colors.textMuted} value={reelTourTitle} onChangeText={setReelTourTitle} />
            <TextInput style={[styles.reelInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Город" placeholderTextColor={colors.textMuted} value={reelCity} onChangeText={setReelCity} />
            <TouchableOpacity style={[styles.buyNewBtn, { backgroundColor: colors.coral }]} onPress={handleSubmitReel} activeOpacity={0.7}>
              <Video size={14} color="#FFFFFF" />
              <Text style={styles.buyNewBtnText}>{"Отправить на модерацию"}</Text>
            </TouchableOpacity>
            {moderationReels.map((reel) => (
              <View key={reel.id} style={[styles.moderationCard, { backgroundColor: colors.surface }]}> 
                <Image source={{ uri: reel.coverImage }} style={styles.moderationImage} contentFit="cover" />
                <View style={styles.moderationInfo}>
                  <Text style={[styles.moderationTitle, { color: colors.text }]} numberOfLines={1}>{reel.title}</Text>
                  <Text style={[styles.moderationStatus, { color: colors.orange }]}>На модерации администратора</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sectionHeader, styles.sectionHeaderLast, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("transactions")}
          activeOpacity={0.7}
          testID="section-transactions"
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.orangeLight }]}>
              <Receipt size={20} color={colors.orange} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{"Транзакции"}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{`${transactions.length} операций`}</Text>
            </View>
          </View>
          {expandedSection === "transactions" ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
        {expandedSection === "transactions" ? (
          <View style={[styles.sectionContent, { backgroundColor: colors.surfaceSecondary }]}>
            {transactions.map((tr) => {
              const config = statusConfig[tr.status] || statusConfig.completed;
              const StatusIcon = config.icon;
              return (
                <View key={tr.id} style={[styles.transactionCard, { backgroundColor: colors.surface }]}>
                  <Image source={{ uri: tr.tourImage }} style={styles.transactionImage} contentFit="cover" />
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>{tr.tourTitle}</Text>
                    <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{tr.date}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: colors.text }]}>
                      {`${tr.status === "refunded" ? "+" : "-"}${tr.amount.toLocaleString()}${tr.currency}`}
                    </Text>
                    <View style={styles.transactionStatus}>
                      <StatusIcon size={12} color={config.color} />
                      <Text style={[styles.transactionStatusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={[styles.menuContainer, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => setShowNotifSettings(!showNotifSettings)}
          testID="settings-notifications"
        >
          <Bell size={20} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>{"Уведомления"}</Text>
          {notifSettings.allEnabled ? (
            <View style={[styles.notifBadge, { backgroundColor: colors.green }]}>
              <Text style={styles.notifBadgeText}>{"Вкл"}</Text>
            </View>
          ) : (
            <View style={[styles.notifBadge, { backgroundColor: colors.gray400 }]}>
              <Text style={styles.notifBadgeText}>{"Выкл"}</Text>
            </View>
          )}
          {showNotifSettings ? (
            <ChevronDown size={18} color={colors.textMuted} />
          ) : (
            <ChevronRight size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {showNotifSettings ? (
          <View style={[styles.notifSettings, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.notifRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.notifIconCircle, notifSettings.allEnabled ? { backgroundColor: colors.tealSoft } : { backgroundColor: colors.gray100 }]}>
                {notifSettings.allEnabled ? (
                  <BellRing size={16} color={colors.teal} />
                ) : (
                  <BellOff size={16} color={colors.gray400} />
                )}
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={[styles.notifLabel, { color: colors.text }]}>{"Все уведомления"}</Text>
                <Text style={[styles.notifDesc, { color: colors.textMuted }]}>{"Главный переключатель"}</Text>
              </View>
              <Switch
                value={notifSettings.allEnabled}
                onValueChange={(v) => updateNotifSetting("allEnabled", v)}
                trackColor={{ false: colors.gray200, true: colors.tealMuted }}
                thumbColor={notifSettings.allEnabled ? colors.teal : colors.gray300}
                testID="switch-all-notif"
              />
            </View>

            <View style={[styles.notifRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.notifIconCircle, { backgroundColor: notifSettings.newTours ? "rgba(15,163,177,0.08)" : colors.gray100 }]}>
                <Navigation size={14} color={notifSettings.newTours ? colors.teal : colors.gray400} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={[styles.notifLabel, { color: notifSettings.allEnabled ? colors.text : colors.textMuted }]}>{"Новые туры"}</Text>
                <Text style={[styles.notifDesc, { color: colors.textMuted }]}>{"Экскурсии в избранных городах"}</Text>
              </View>
              <Switch
                value={notifSettings.newTours}
                onValueChange={(v) => updateNotifSetting("newTours", v)}
                disabled={!notifSettings.allEnabled}
                trackColor={{ false: colors.gray200, true: colors.tealMuted }}
                thumbColor={notifSettings.newTours ? colors.teal : colors.gray300}
                testID="switch-new-tours"
              />
            </View>

            <View style={[styles.notifRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.notifIconCircle, { backgroundColor: notifSettings.priceDrops ? colors.orangeLight : colors.gray100 }]}>
                <Tag size={14} color={notifSettings.priceDrops ? colors.orange : colors.gray400} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={[styles.notifLabel, { color: notifSettings.allEnabled ? colors.text : colors.textMuted }]}>{"Снижение цен"}</Text>
                <Text style={[styles.notifDesc, { color: colors.textMuted }]}>{"Скидки на избранные туры"}</Text>
              </View>
              <Switch
                value={notifSettings.priceDrops}
                onValueChange={(v) => updateNotifSetting("priceDrops", v)}
                disabled={!notifSettings.allEnabled}
                trackColor={{ false: colors.gray200, true: colors.tealMuted }}
                thumbColor={notifSettings.priceDrops ? colors.teal : colors.gray300}
                testID="switch-price-drops"
              />
            </View>

            <View style={[styles.notifRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.notifIconCircle, { backgroundColor: notifSettings.bookingUpdates ? colors.greenLight : colors.gray100 }]}>
                <StarIcon2 size={14} color={notifSettings.bookingUpdates ? colors.green : colors.gray400} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={[styles.notifLabel, { color: notifSettings.allEnabled ? colors.text : colors.textMuted }]}>{"Статус бронирования"}</Text>
                <Text style={[styles.notifDesc, { color: colors.textMuted }]}>{"Обновления по вашим поездкам"}</Text>
              </View>
              <Switch
                value={notifSettings.bookingUpdates}
                onValueChange={(v) => updateNotifSetting("bookingUpdates", v)}
                disabled={!notifSettings.allEnabled}
                trackColor={{ false: colors.gray200, true: colors.tealMuted }}
                thumbColor={notifSettings.bookingUpdates ? colors.teal : colors.gray300}
                testID="switch-booking-updates"
              />
            </View>

            <View style={styles.notifRowLast}>
              <View style={[styles.notifIconCircle, { backgroundColor: notifSettings.promotions ? "rgba(232,185,49,0.1)" : colors.gray100 }]}>
                <Megaphone size={14} color={notifSettings.promotions ? colors.gold : colors.gray400} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={[styles.notifLabel, { color: notifSettings.allEnabled ? colors.text : colors.textMuted }]}>{"Акции и промо"}</Text>
                <Text style={[styles.notifDesc, { color: colors.textMuted }]}>{"Специальные предложения"}</Text>
              </View>
              <Switch
                value={notifSettings.promotions}
                onValueChange={(v) => updateNotifSetting("promotions", v)}
                disabled={!notifSettings.allEnabled}
                trackColor={{ false: colors.gray200, true: colors.tealMuted }}
                thumbColor={notifSettings.promotions ? colors.teal : colors.gray300}
                testID="switch-promotions"
              />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => setShowThemeSettings(!showThemeSettings)}
          testID="settings-theme"
        >
          <Settings size={20} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>{"Тема оформления"}</Text>
          {showThemeSettings ? (
            <ChevronDown size={18} color={colors.textMuted} />
          ) : (
            <ChevronRight size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {showThemeSettings ? (
          <View style={[styles.themeSettings, { backgroundColor: colors.surfaceSecondary }]}>
            {themeOptions.map((option) => {
              const isActive = themeMode === option.key;
              const OptionIcon = option.icon;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.themeOption,
                    { borderBottomColor: colors.border },
                    isActive && { backgroundColor: colors.tealSoft },
                  ]}
                  onPress={() => setTheme(option.key)}
                  activeOpacity={0.6}
                  testID={`profile-theme-${option.key}`}
                >
                  <View style={[styles.themeIconCircle, isActive ? { backgroundColor: colors.teal } : { backgroundColor: colors.surface }]}>
                    <OptionIcon size={16} color={isActive ? "#FFFFFF" : colors.textMuted} />
                  </View>
                  <Text style={[styles.themeOptionText, { color: isActive ? colors.text : colors.textSecondary }]}>
                    {option.label}
                  </Text>
                  {isActive && <Check size={18} color={colors.teal} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => router.push("/support")}
          testID="menu-support"
        >
          <Headphones size={20} color={colors.teal} />
          <Text style={[styles.menuText, { color: colors.text }]}>{"Поддержка YAVOY"}</Text>
          <View style={[styles.notifBadge, { backgroundColor: colors.teal }]}>
            <Text style={styles.notifBadgeText}>{"AI"}</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => router.push("/partner")}
          testID="menu-partner"
        >
          <Building2 size={20} color={colors.teal} />
          <Text style={[styles.menuText, { color: colors.text }]}>{"Партнёры"}</Text>
          <View style={[styles.notifBadge, { backgroundColor: colors.teal }]}>
            <Text style={styles.notifBadgeText}>{"B2B"}</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {(auth.role === "admin" || auth.role === "moderator") && (
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push("/admin")}
            testID="menu-admin"
          >
            <ShieldCheck size={20} color={colors.gold} />
            <Text style={[styles.menuText, { color: colors.text }]}>{"Админ-панель"}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
          <HelpCircle size={20} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>{"Помощь"}</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {auth.isAuthenticated ? (
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            activeOpacity={0.7}
            onPress={() => {
              auth.logout().catch(() => {});
            }}
          >
            <LogOut size={20} color={colors.red} />
            <Text style={[styles.menuText, { color: colors.red }]}>{"Выйти"}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            activeOpacity={0.7}
            onPress={() => router.push("/auth/login")}
          >
            <LogOut size={20} color={colors.teal} />
            <Text style={[styles.menuText, { color: colors.teal }]}>{"Войти / Зарегистрироваться"}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={!!voucherBooking} transparent animationType="slide" onRequestClose={() => setVoucherBooking(null)}>
        <View style={[styles.legalModalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: colors.text }]}>{"Ваучер"}</Text>
              <TouchableOpacity onPress={() => setVoucherBooking(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {voucherBooking ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.legalScrollContent}>
                <View style={[styles.voucherCardLarge, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.teal + "40" }]}>
                  <View style={[styles.voucherAccentBar, { backgroundColor: colors.teal }]} />
                  <View style={styles.voucherLargeHeader}>
                    <Text style={[styles.voucherBrand, { color: colors.teal }]}>{"YAVOY"}</Text>
                    <Ticket size={24} color={colors.gold} />
                  </View>
                  <Text style={[styles.voucherType, { color: colors.textMuted }]}>{"ВАУЧЕР НА ЭКСКУРСИЮ"}</Text>
                  <Text style={[styles.voucherTourName, { color: colors.text }]}>{voucherBooking.tourTitle}</Text>
                  <View style={[styles.voucherDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Дата:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{voucherBooking.tourDate}</Text>
                  </View>
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Время:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{voucherBooking.tourStartTime}</Text>
                  </View>
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Участник:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{`${voucherBooking.firstName} ${voucherBooking.lastName}`}</Text>
                  </View>
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Оплата:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.teal }]}>{`${voucherBooking.totalPrice.toLocaleString()} ${voucherBooking.currency}`}</Text>
                  </View>
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Организатор:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{voucherBooking.organizerName}</Text>
                  </View>
                  {voucherBooking.meetingPoint ? (
                    <View style={styles.voucherRow}>
                      <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Место встречи:"}</Text>
                      <Text style={[styles.voucherFieldValue, { color: colors.text, flex: 1 }]} numberOfLines={2}>{voucherBooking.meetingPoint}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.qrPlaceholder, { borderColor: colors.teal + "30" }]}>
                    <Text style={[styles.qrText, { color: colors.teal }]}>{"QR"}</Text>
                    <Text style={[styles.qrSubtext, { color: colors.textMuted }]}>{voucherBooking.confirmationCode}</Text>
                  </View>
                  <Text style={[styles.voucherConfCode, { color: colors.teal }]}>{voucherBooking.confirmationCode}</Text>
                </View>
                <View style={styles.voucherActions}>
                  <TouchableOpacity
                    style={[styles.voucherActionBtn, { backgroundColor: colors.teal }]}
                    onPress={() => {
                      Share.share({
                        message: `YAVOY Ваучер\n${voucherBooking.tourTitle}\nДата: ${voucherBooking.tourDate}\nВремя: ${voucherBooking.tourStartTime}\nКод: ${voucherBooking.confirmationCode}`,
                        title: "Ваучер YAVOY",
                      }).catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.voucherActionText}>{"Поделиться"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voucherActionBtn, { backgroundColor: colors.gold }]}
                    onPress={() => {
                      Alert.alert("Wallet", "Ваучер будет добавлен в Apple Wallet / Google Pay");
                    }}
                    activeOpacity={0.7}
                  >
                    <Wallet size={16} color="#1B2838" />
                    <Text style={[styles.voucherActionText, { color: "#1B2838" }]}>{"В Wallet"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={!!voucherCert} transparent animationType="slide" onRequestClose={() => setVoucherCert(null)}>
        <View style={[styles.legalModalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: colors.text }]}>{"Сертификат"}</Text>
              <TouchableOpacity onPress={() => setVoucherCert(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {voucherCert ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.legalScrollContent}>
                <View style={[styles.voucherCardLarge, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.gold + "40" }]}>
                  <View style={[styles.voucherAccentBar, { backgroundColor: colors.gold }]} />
                  <View style={styles.voucherLargeHeader}>
                    <Text style={[styles.voucherBrand, { color: colors.gold }]}>{"YAVOY"}</Text>
                    <Gift size={24} color={colors.gold} />
                  </View>
                  <Text style={[styles.voucherType, { color: colors.textMuted }]}>{"ПОДАРОЧНЫЙ СЕРТИФИКАТ"}</Text>
                  <Text style={[styles.voucherNominalLarge, { color: colors.gold }]}>{`${voucherCert.nominal.toLocaleString()} ${voucherCert.currency}`}</Text>
                  <View style={[styles.voucherDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"Кому:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{voucherCert.toName}</Text>
                  </View>
                  <View style={styles.voucherRow}>
                    <Text style={[styles.voucherFieldLabel, { color: colors.textMuted }]}>{"От:"}</Text>
                    <Text style={[styles.voucherFieldValue, { color: colors.text }]}>{voucherCert.fromName}</Text>
                  </View>
                  <View style={[styles.qrPlaceholder, { borderColor: colors.gold + "30" }]}>
                    <Text style={[styles.qrText, { color: colors.gold }]}>{"QR"}</Text>
                    <Text style={[styles.qrSubtext, { color: colors.textMuted }]}>{voucherCert.code}</Text>
                  </View>
                  <Text style={[styles.voucherConfCode, { color: colors.gold }]}>{voucherCert.code}</Text>
                </View>
                <View style={styles.voucherActions}>
                  <TouchableOpacity
                    style={[styles.voucherActionBtn, { backgroundColor: colors.teal }]}
                    onPress={() => {
                      Share.share({
                        message: `YAVOY Подарочный сертификат\nНоминал: ${voucherCert.nominal.toLocaleString()} ${voucherCert.currency}\nКому: ${voucherCert.toName}\nОт: ${voucherCert.fromName}\nКод: ${voucherCert.code}`,
                        title: "Сертификат YAVOY",
                      }).catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.voucherActionText}>{"Поделиться"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voucherActionBtn, { backgroundColor: colors.gold }]}
                    onPress={() => {
                      Alert.alert("Wallet", "Сертификат будет добавлен в Apple Wallet / Google Pay");
                    }}
                    activeOpacity={0.7}
                  >
                    <Wallet size={16} color="#1B2838" />
                    <Text style={[styles.voucherActionText, { color: "#1B2838" }]}>{"В Wallet"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <CertificateModal visible={certModalVisible} onClose={() => setCertModalVisible(false)} />

      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => setTermsModalVisible(true)}
          activeOpacity={0.7}
          testID="link-terms"
        >
          <FileText size={14} color={colors.textMuted} />
          <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>{"Условия использования"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => setAboutModalVisible(true)}
          activeOpacity={0.7}
          testID="link-about"
        >
          <Info size={14} color={colors.textMuted} />
          <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>{"О компании"}</Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>{`YAVOY v${APP_VERSION}`}</Text>
      </View>

      <Modal visible={termsModalVisible} transparent animationType="slide" onRequestClose={() => setTermsModalVisible(false)}>
        <View style={[styles.legalModalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: colors.text }]}>{"Условия использования"}</Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll} contentContainerStyle={styles.legalScrollContent}>
              <Text style={[styles.legalText, { color: colors.textSecondary }]}>{TERMS_CONTENT}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={aboutModalVisible} transparent animationType="slide" onRequestClose={() => setAboutModalVisible(false)}>
        <View style={[styles.legalModalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: colors.text }]}>{"О компании"}</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll} contentContainerStyle={styles.legalScrollContent}>
              <Text style={[styles.legalText, { color: colors.textSecondary }]}>{ABOUT_CONTENT}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
  profileCard: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  avatar: { width: "100%", height: "100%" },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  userName: { fontSize: 20, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 18 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 17, fontWeight: "800" as const },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  sectionsContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionHeaderLast: { borderBottomWidth: 0 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "600" as const },
  sectionCount: { fontSize: 12, marginTop: 1 },
  sectionContent: { paddingHorizontal: 12, paddingVertical: 8 },
  emptySection: { fontSize: 13, textAlign: "center" as const, paddingVertical: 16 },
  miniCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    gap: 10,
  },
  miniImage: { width: 50, height: 50, borderRadius: 10 },
  miniInfo: { flex: 1 },
  miniTitle: { fontSize: 14, fontWeight: "600" as const },
  miniLocationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  miniLocation: { fontSize: 11 },
  miniPrice: { fontSize: 13, fontWeight: "700" as const, marginTop: 2 },
  purchasedCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    gap: 10,
  },
  purchasedImage: { width: 60, height: 60, borderRadius: 10 },
  purchasedInfo: { flex: 1 },
  purchasedTitle: { fontSize: 14, fontWeight: "600" as const },
  purchasedMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  purchasedDate: { fontSize: 12 },
  purchasedTickets: { fontSize: 12 },
  purchasedBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: "600" as const },
  confirmCode: { fontSize: 11, fontFamily: "monospace" },
  reviewCard: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  reviewTop: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  reviewImage: { width: 48, height: 48, borderRadius: 10 },
  reviewInfo: { flex: 1 },
  reviewTourTitle: { fontSize: 14, fontWeight: "600" as const, marginBottom: 3 },
  reviewStars: { flexDirection: "row", gap: 2, marginBottom: 2 },
  reviewDateText: { fontSize: 11 },
  reviewText: { fontSize: 13, lineHeight: 19 },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    gap: 10,
  },
  transactionImage: { width: 40, height: 40, borderRadius: 8 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 13, fontWeight: "600" as const },
  transactionDate: { fontSize: 11, marginTop: 2 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 14, fontWeight: "700" as const },
  transactionStatus: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  transactionStatusText: { fontSize: 11, fontWeight: "500" as const },
  menuContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500" as const },
  themeSettings: { paddingHorizontal: 8, paddingVertical: 4 },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  themeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  themeOptionText: { flex: 1, fontSize: 14, fontWeight: "500" as const },
  notifBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 4 },
  notifBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" as const },
  notifSettings: { paddingHorizontal: 8, paddingVertical: 4 },
  notifRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  notifRowLast: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  notifTextWrap: { flex: 1 },
  notifLabel: { fontSize: 14, fontWeight: "500" as const },
  notifDesc: { fontSize: 11, marginTop: 1 },
  footerSection: {
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: "center",
    gap: 12,
    paddingBottom: 10,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: "500" as const,
    textDecorationLine: "underline" as const,
  },
  versionText: {
    textAlign: "center" as const,
    fontSize: 11,
    marginTop: 4,
  },
  legalModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  legalModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "50%",
  },
  legalModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  legalModalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  legalScroll: {
    flex: 1,
  },
  legalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 22,
  },
  voucherLink: {
    fontSize: 12,
    fontWeight: "600" as const,
    textDecorationLine: "underline" as const,
  },
  buyNewBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 4,
  },
  buyNewBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  certCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    gap: 10,
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  certInfo: { flex: 1 },
  certNominal: { fontSize: 15, fontWeight: "700" as const },
  certTo: { fontSize: 12, marginTop: 2 },
  certCode: { fontSize: 11, fontFamily: "monospace" },
  promoInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  promoInfoText: { fontSize: 12, flex: 1, lineHeight: 17 },
  reelsRewardBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reelsRewardText: { fontSize: 12, flex: 1, lineHeight: 17, fontWeight: "600" as const },
  videoPickCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 4,
  },
  videoPickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
  videoPickTextWrap: { flex: 1 },
  videoPickTitle: { fontSize: 14, fontWeight: "700" as const },
  videoPickSub: { fontSize: 12, marginTop: 2 },
  reelInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginVertical: 4,
  },
  moderationCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
  },
  moderationImage: { width: 44, height: 58, borderRadius: 10 },
  moderationInfo: { flex: 1 },
  moderationTitle: { fontSize: 13, fontWeight: "700" as const },
  moderationStatus: { fontSize: 11, marginTop: 3, fontWeight: "600" as const },
  promoCard: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  promoCodeBadge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  promoCodeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  promoMeta: { flexDirection: "row" as const, justifyContent: "space-between" as const },
  promoDate: { fontSize: 11 },
  promoActivations: { fontSize: 11, fontWeight: "500" as const },
  voucherCardLarge: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  voucherLargeHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  voucherBrand: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  voucherType: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 3,
    marginBottom: 8,
  },
  voucherTourName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 16,
  },
  voucherNominalLarge: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: "#E8B931",
    marginBottom: 16,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
  },
  voucherRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  voucherFieldLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  voucherFieldValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  qrPlaceholder: {
    alignSelf: "center" as const,
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginVertical: 20,
  },
  qrText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#1B2838",
  },
  qrSubtext: {
    fontSize: 7,
    color: "#1B2838",
    fontFamily: "monospace",
    marginTop: 4,
  },
  voucherConfCode: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    fontFamily: "monospace",
    letterSpacing: 2,
    marginTop: 4,
  },
  voucherAccentBar: {
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 12,
    marginTop: -24,
    marginHorizontal: -24,
  },
  voucherActions: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  voucherActionBtn: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  voucherActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
});


import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
  FlatList,
  Animated,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  MapPin,
  Car,
  Waves,
  Ship,
  Bike,
  Plane,
  Users,
  Check,
  X,
  Zap,
  RotateCcw,
  ShieldCheck,
  Star,
  Calendar,
  Globe,
  ChevronRight,
  Flame,
  Backpack,
  Navigation,
  ExternalLink,
  FileText,
  CreditCard,
  Ban,
  UserPlus,
  Phone,
  Mail,
  User,
  Eye,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import StarRating from "@/components/StarRating";
import { tours } from "@/mocks/tours";
import { categoryTours } from "@/mocks/categoryTours";
import { cityNameMap } from "@/mocks/cities";
import { useFavorites } from "@/providers/FavoritesProvider";
import { useViewedTours } from "@/providers/ViewedToursProvider";
import { useBookings } from "@/providers/BookingsProvider";
import { useLoyalty } from "@/providers/LoyaltyProvider";
import { Tour, TourReview, BookedTour } from "@/types/tour";

const allTours = [...tours, ...categoryTours];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const transportIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  auto: Car, water: Waves, sea: Ship, bike: Bike, air: Plane,
};
const transportLabels: Record<string, string> = {
  auto: "Автомобильная", water: "Водная", sea: "Морская", bike: "Велосипедная", air: "Авиа",
};
const interestLabels: Record<string, string> = {
  city: "Городская", educational: "Познавательная", nature: "Природная", pilgrimage: "Паломничество",
};

function ReviewCard({ review }: { review: TourReview }) {
  const { colors } = useTheme();
  return (
    <View style={[detailStyles.reviewCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={detailStyles.reviewHeader}>
        <Image source={{ uri: review.avatar }} style={[detailStyles.reviewAvatar, { backgroundColor: colors.surfaceSecondary }]} contentFit="cover" />
        <View style={detailStyles.reviewAuthorInfo}>
          <Text style={[detailStyles.reviewAuthor, { color: colors.text }]}>{review.author}</Text>
          <Text style={[detailStyles.reviewDate, { color: colors.textMuted }]}>{review.date}</Text>
        </View>
        <View style={[detailStyles.reviewRating, { backgroundColor: colors.tealSoft }]}>
          <Star size={13} color={colors.gold} fill={colors.gold} />
          <Text style={[detailStyles.reviewRatingText, { color: colors.teal }]}>{String(review.rating)}</Text>
        </View>
      </View>
      <Text style={[detailStyles.reviewText, { color: colors.textSecondary }]}>{review.text}</Text>
    </View>
  );
}

function GalleryDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={detailStyles.dotsContainer}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[detailStyles.dot, i === active && detailStyles.dotActive]} />
      ))}
    </View>
  );
}

function GallerySection({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    setActiveIndex(index);
  }, []);

  return (
    <View style={detailStyles.galleryContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img }} style={detailStyles.galleryImage} contentFit="cover" transition={200} />
        ))}
      </ScrollView>
      {images.length > 1 ? <GalleryDots count={images.length} active={activeIndex} /> : null}
    </View>
  );
}

function MapPickerModal({
  visible,
  onClose,
  meetingPoint,
  coords,
}: {
  visible: boolean;
  onClose: () => void;
  meetingPoint: string;
  coords?: { lat: number; lng: number };
}) {
  const { colors } = useTheme();

  const openInYandex = useCallback(() => {
    let url: string;
    if (coords) {
      url = `https://yandex.ru/maps/?pt=${coords.lng},${coords.lat}&z=16&l=map&text=${encodeURIComponent(meetingPoint)}`;
    } else {
      url = `https://yandex.ru/maps/?text=${encodeURIComponent(meetingPoint)}`;
    }
    void Linking.openURL(url);
    onClose();
  }, [coords, meetingPoint, onClose]);

  const openIn2GIS = useCallback(() => {
    let url: string;
    if (coords) {
      url = `https://2gis.ru/search/${encodeURIComponent(meetingPoint)}?m=${coords.lng},${coords.lat}/16`;
    } else {
      url = `https://2gis.ru/search/${encodeURIComponent(meetingPoint)}`;
    }
    void Linking.openURL(url);
    onClose();
  }, [coords, meetingPoint, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={detailStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[detailStyles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[detailStyles.modalTitle, { color: colors.text }]}>{"Открыть в карте"}</Text>
          <Text style={[detailStyles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>{meetingPoint}</Text>

          <TouchableOpacity style={[detailStyles.mapOption, { backgroundColor: colors.surfaceSecondary }]} onPress={openInYandex} activeOpacity={0.7}>
            <View style={[detailStyles.mapIconWrap, { backgroundColor: "#FC3F1D" + "18" }]}>
              <Text style={detailStyles.mapEmoji}>{"🗺"}</Text>
            </View>
            <View style={detailStyles.mapOptionText}>
              <Text style={[detailStyles.mapOptionTitle, { color: colors.text }]}>{"Яндекс Карты"}</Text>
              <Text style={[detailStyles.mapOptionDesc, { color: colors.textMuted }]}>{"Навигация и маршрут"}</Text>
            </View>
            <ExternalLink size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[detailStyles.mapOption, { backgroundColor: colors.surfaceSecondary }]} onPress={openIn2GIS} activeOpacity={0.7}>
            <View style={[detailStyles.mapIconWrap, { backgroundColor: "#2DB94D" + "18" }]}>
              <Text style={detailStyles.mapEmoji}>{"📍"}</Text>
            </View>
            <View style={detailStyles.mapOptionText}>
              <Text style={[detailStyles.mapOptionTitle, { color: colors.text }]}>{"2ГИС"}</Text>
              <Text style={[detailStyles.mapOptionDesc, { color: colors.textMuted }]}>{"Подробная карта города"}</Text>
            </View>
            <ExternalLink size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[detailStyles.modalCancel, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.7}>
            <Text style={[detailStyles.modalCancelText, { color: colors.textSecondary }]}>{"Отмена"}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function BookingAuthModal({
  visible,
  onClose,
  tour,
  onBookingComplete,
}: {
  visible: boolean;
  onClose: () => void;
  tour: Tour | null;
  onBookingComplete: (booking: BookedTour) => void;
}) {
  const { colors } = useTheme();
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState<string>("");
  const [emailValue, setEmailValue] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  const handleBook = useCallback(() => {
    if (!tour) return;
    const contact = authMode === "phone" ? phoneValue : emailValue;
    if (!contact.trim()) {
      Alert.alert("Ошибка", authMode === "phone" ? "Введите номер телефона" : "Введите email");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Ошибка", "Введите имя и фамилию");
      return;
    }
    const booking: BookedTour = {
      id: `bk-${Date.now()}`,
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.image,
      tourCity: tour.city,
      tourDate: tour.nextAvailableDate,
      tourStartTime: tour.startTime || "10:00",
      ticketCount: 1,
      totalPrice: tour.price,
      currency: tour.currency,
      confirmationCode: `YV-${Date.now().toString(36).toUpperCase()}`,
      status: "upcoming",
      bookedAt: new Date().toISOString().split("T")[0],
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contact: contact.trim(),
      organizerName: tour.organizer.name,
      meetingPoint: tour.meetingPoint,
    };
    console.log("[BookingAuth] Booking:", booking);
    onBookingComplete(booking);
    Alert.alert("Бронирование", `Заявка на "${tour.title}" отправлена! Тур добавлен в ваши поездки.`);
    onClose();
    setPhoneValue("");
    setEmailValue("");
    setFirstName("");
    setLastName("");
  }, [authMode, phoneValue, emailValue, firstName, lastName, tour, onClose, onBookingComplete]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={detailStyles.modalOverlay}>
        <TouchableOpacity style={detailStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[detailStyles.bookingModalContent, { backgroundColor: colors.surface }]}>
              <View style={detailStyles.bookingModalHandle}>
                <View style={[detailStyles.bookingHandle, { backgroundColor: colors.gray300 }]} />
              </View>

              <Text style={[detailStyles.bookingModalTitle, { color: colors.text }]}>{"Бронирование"}</Text>
              <Text style={[detailStyles.bookingModalSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>{tour?.title || ""}</Text>

              <View style={detailStyles.authModeRow}>
                <TouchableOpacity
                  style={[detailStyles.authModeBtn, authMode === "phone" && { backgroundColor: colors.teal }]}
                  onPress={() => setAuthMode("phone")}
                  activeOpacity={0.7}
                >
                  <Phone size={14} color={authMode === "phone" ? "#FFFFFF" : colors.textMuted} />
                  <Text style={[detailStyles.authModeBtnText, { color: authMode === "phone" ? "#FFFFFF" : colors.textMuted }]}>{"Телефон"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.authModeBtn, authMode === "email" && { backgroundColor: colors.teal }]}
                  onPress={() => setAuthMode("email")}
                  activeOpacity={0.7}
                >
                  <Mail size={14} color={authMode === "email" ? "#FFFFFF" : colors.textMuted} />
                  <Text style={[detailStyles.authModeBtnText, { color: authMode === "email" ? "#FFFFFF" : colors.textMuted }]}>{"Email"}</Text>
                </TouchableOpacity>
              </View>

              {authMode === "phone" ? (
                <View style={[detailStyles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Phone size={16} color={colors.textMuted} />
                  <TextInput
                    style={[detailStyles.inputField, { color: colors.text }]}
                    placeholder="+7 (___) ___-__-__"
                    placeholderTextColor={colors.textMuted}
                    value={phoneValue}
                    onChangeText={setPhoneValue}
                    keyboardType="phone-pad"
                    testID="booking-phone"
                  />
                </View>
              ) : (
                <View style={[detailStyles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Mail size={16} color={colors.textMuted} />
                  <TextInput
                    style={[detailStyles.inputField, { color: colors.text }]}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={emailValue}
                    onChangeText={setEmailValue}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="booking-email"
                  />
                </View>
              )}

              <View style={[detailStyles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <User size={16} color={colors.textMuted} />
                <TextInput
                  style={[detailStyles.inputField, { color: colors.text }]}
                  placeholder="Имя"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  testID="booking-firstname"
                />
              </View>

              <View style={[detailStyles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <User size={16} color={colors.textMuted} />
                <TextInput
                  style={[detailStyles.inputField, { color: colors.text }]}
                  placeholder="Фамилия"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  testID="booking-lastname"
                />
              </View>

              <TouchableOpacity
                style={[detailStyles.bookingSubmitBtn, { backgroundColor: colors.teal }]}
                onPress={handleBook}
                activeOpacity={0.8}
                testID="booking-submit"
              >
                <Text style={detailStyles.bookingSubmitText}>{"Забронировать"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={detailStyles.bookingCancelBtn} activeOpacity={0.7}>
                <Text style={[detailStyles.bookingCancelText, { color: colors.textSecondary }]}>{"Отмена"}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SimilarTourCard({ tour, onPress }: { tour: Tour; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[detailStyles.similarCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: tour.image }} style={detailStyles.similarImage} contentFit="cover" transition={200} />
      <View style={detailStyles.similarContent}>
        <Text style={[detailStyles.similarTitle, { color: colors.text }]} numberOfLines={2}>{tour.title}</Text>
        <View style={detailStyles.similarMeta}>
          <MapPin size={11} color={colors.teal} />
          <Text style={[detailStyles.similarCity, { color: colors.textMuted }]}>{cityNameMap[tour.city] || tour.city}</Text>
        </View>
        <Text style={[detailStyles.similarPrice, { color: colors.teal }]}>{`${tour.price.toLocaleString()} ${tour.currency}`}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PolicySection({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  text,
  colors,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  text: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={[detailStyles.policyItem, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={[detailStyles.policyIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={detailStyles.policyTextWrap}>
        <Text style={[detailStyles.policyTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[detailStyles.policyText, { color: colors.textSecondary }]}>{text}</Text>
      </View>
    </View>
  );
}

export default function TourDetailScreen() {
  const params = useLocalSearchParams<{ tourId: string; tourIds: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { markViewed } = useViewedTours();
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [mapModalData, setMapModalData] = useState<{ meetingPoint: string; coords?: { lat: number; lng: number } }>({ meetingPoint: "" });
  const [bookingModalVisible, setBookingModalVisible] = useState<boolean>(false);
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);

  console.log("[TourDetailScreen] Rendering with params:", params.tourId);

  const { addBooking } = useBookings();
  const { addPointsFromPurchase } = useLoyalty();
  const tourIdList = useMemo(() => (params.tourIds ? params.tourIds.split(",") : [params.tourId]), [params.tourIds, params.tourId]);
  const tourList = useMemo(() => tourIdList.map((id) => allTours.find((t) => t.id === id)).filter((t): t is Tour => t !== undefined), [tourIdList]);
  const initialIndex = useMemo(() => Math.max(0, tourList.findIndex((t) => t.id === params.tourId)), [tourList, params.tourId]);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const flatListRef = useRef<FlatList<Tour>>(null);

  React.useEffect(() => {
    if (params.tourId) {
      markViewed(params.tourId);
    }
  }, [params.tourId, markViewed]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<{ index: number | null; item: Tour }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
      if (viewableItems[0].item) {
        markViewed(viewableItems[0].item.id);
      }
    }
  }, [markViewed]);
  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 50 }), []);

  const handleBack = useCallback(() => { router.back(); }, [router]);

  const handleFavorite = useCallback((tourId: string) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(tourId);
  }, [toggleFavorite]);

  const handleShare = useCallback(async (tour: Tour) => {
    try {
      const lines: string[] = [
        `🏷 ${tour.title}`,
        `📍 ${cityNameMap[tour.city] || tour.city}`,
        `💰 ${tour.price.toLocaleString()} ${tour.currency} за человека`,
        tour.originalPrice ? `🔥 Скидка! Было ${tour.originalPrice.toLocaleString()} ${tour.currency}` : "",
        `⏱ ${tour.durationText}`,
        tour.startTime ? `🕐 Начало: ${tour.startTime}` : "",
        `👥 ${tour.groupSize}`,
        `🗣 ${tour.languages.join(", ")}`,
        `📅 ${tour.schedule}`,
        "",
        tour.description,
        "",
        tour.highlights.length > 0 ? `✨ ${tour.highlights.join(", ")}` : "",
        "",
        `✅ Включено: ${tour.includes.join(", ")}`,
        `❌ Не включено: ${tour.excludes.join(", ")}`,
        "",
        tour.meetingPoint ? `📌 Место встречи: ${tour.meetingPoint}` : "",
        tour.whatToBring && tour.whatToBring.length > 0 ? `🎒 Что взять: ${tour.whatToBring.join(", ")}` : "",
        tour.bookingConditions ? `📋 Условия: ${tour.bookingConditions}` : "",
        tour.prepayment ? `💳 Предоплата: ${tour.prepayment}` : "",
        tour.cancellationPolicy ? `🔄 Отмена: ${tour.cancellationPolicy}` : "",
        "",
        `👤 Организатор: ${tour.organizer.name} (${tour.organizer.rating}⭐, ${tour.organizer.reviewCount} отзывов)`,
        "",
        "YAVOY Travel Group",
      ];
      const message = lines.filter(Boolean).join("\n");
      await Share.share({ message });
    } catch (e) {
      console.log("Share error:", e);
    }
  }, []);

  const handleMeetingPointPress = useCallback((meetingPoint: string, coords?: { lat: number; lng: number }) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapModalData({ meetingPoint, coords });
    setMapModalVisible(true);
  }, []);

  const handleBookPress = useCallback((tour: Tour) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBookingTour(tour);
    setBookingModalVisible(true);
  }, []);

  const handleBookingComplete = useCallback((booking: BookedTour) => {
    addBooking(booking);
    addPointsFromPurchase(booking.totalPrice);
    console.log("[TourDetail] Booking completed:", booking.id);
  }, [addBooking, addPointsFromPurchase]);

  const handleSimilarTourPress = useCallback((tourId: string) => {
    router.push({ pathname: "/tour-detail", params: { tourId, tourIds: tourId } });
  }, [router]);

  const renderTourPage = useCallback(({ item: tour }: { item: Tour }) => {
    const liked = isFavorite(tour.id);
    const TransportIcon = transportIcons[tour.transport] || Car;
    const hasDiscount = tour.originalPrice && tour.originalPrice > tour.price;
    const discountPercent = hasDiscount ? Math.round(((tour.originalPrice! - tour.price) / tour.originalPrice!) * 100) : 0;
    const allImages = [tour.image, ...tour.gallery];

    const similarTours = allTours
      .filter((t) => t.id !== tour.id && (t.city === tour.city || t.interest === tour.interest))
      .slice(0, 6);

    return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <ScrollView style={detailStyles.page} contentContainerStyle={detailStyles.pageContent} showsVerticalScrollIndicator={false}>
          <GallerySection images={allImages} />

          <View style={[detailStyles.contentSection, { backgroundColor: colors.background }]}>
            <View style={detailStyles.topBadgesRow}>
              {tour.isBestseller ? (
                <View style={detailStyles.bestsellerBadge}>
                  <Flame size={12} color="#FFFFFF" />
                  <Text style={detailStyles.bestsellerText}>{"Хит продаж"}</Text>
                </View>
              ) : null}
              {tour.isLikelyToSellOut ? (
                <View style={[detailStyles.sellOutBadge, { backgroundColor: colors.orangeLight }]}>
                  <Text style={[detailStyles.sellOutText, { color: colors.orange }]}>{"\uD83D\uDD25 Раскупают быстро"}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[detailStyles.tourTitle, { color: colors.text }]}>{tour.title}</Text>

            <View style={detailStyles.metaRow}>
              <View style={detailStyles.metaItem}>
                <MapPin size={14} color={colors.teal} />
                <Text style={[detailStyles.metaText, { color: colors.textSecondary }]}>{cityNameMap[tour.city] || tour.city}</Text>
              </View>
              <View style={detailStyles.metaItem}>
                <TransportIcon size={14} color={colors.teal} />
                <Text style={[detailStyles.metaText, { color: colors.textSecondary }]}>{transportLabels[tour.transport]}</Text>
              </View>
              <View style={detailStyles.metaItem}>
                <Clock size={14} color={colors.teal} />
                <Text style={[detailStyles.metaText, { color: colors.textSecondary }]}>{tour.durationText}</Text>
              </View>
            </View>

            <View style={[detailStyles.interestBadge, { backgroundColor: colors.tealSoft }]}>
              <Text style={[detailStyles.interestText, { color: colors.teal }]}>{interestLabels[tour.interest] || tour.interest}</Text>
            </View>

            <View style={detailStyles.featureRow}>
              {tour.isInstantConfirmation ? (
                <View style={[detailStyles.featureItem, { backgroundColor: colors.tealSoft }]}>
                  <Zap size={14} color={colors.teal} />
                  <Text style={[detailStyles.featureText, { color: colors.teal }]}>{"Мгновенное подтверждение"}</Text>
                </View>
              ) : null}
              {tour.isFreeCancellation ? (
                <View style={[detailStyles.featureItem, { backgroundColor: colors.greenLight }]}>
                  <RotateCcw size={14} color={colors.green} />
                  <Text style={[detailStyles.featureText, { color: colors.green }]}>{"Бесплатная отмена"}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[detailStyles.description, { color: colors.textSecondary }]}>{tour.description}</Text>

            {tour.highlights.length > 0 ? (
              <View style={detailStyles.section}>
                <Text style={[detailStyles.sectionTitle, { color: colors.text }]}>{"Основные моменты"}</Text>
                {tour.highlights.map((h, i) => (
                  <View key={i} style={detailStyles.highlightItem}>
                    <View style={[detailStyles.highlightDot, { backgroundColor: colors.teal }]} />
                    <Text style={[detailStyles.highlightText, { color: colors.textSecondary }]}>{h}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {tour.whatToBring && tour.whatToBring.length > 0 ? (
              <View style={[detailStyles.whatToBringSection, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                <View style={detailStyles.whatToBringHeader}>
                  <View style={[detailStyles.whatToBringIconWrap, { backgroundColor: colors.orangeLight }]}>
                    <Backpack size={18} color={colors.orange} />
                  </View>
                  <Text style={[detailStyles.whatToBringSectionTitle, { color: colors.text }]}>{"Что взять с собой"}</Text>
                </View>
                <View style={detailStyles.whatToBringList}>
                  {tour.whatToBring.map((item, i) => (
                    <View key={i} style={detailStyles.whatToBringItem}>
                      <Check size={14} color={colors.teal} />
                      <Text style={[detailStyles.whatToBringText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={[detailStyles.includesSection, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <View style={detailStyles.includesCol}>
                <Text style={[detailStyles.includesTitle, { color: colors.text }]}>{"Включено"}</Text>
                {tour.includes.map((item, i) => (
                  <View key={i} style={detailStyles.includesItem}>
                    <Check size={14} color={colors.green} />
                    <Text style={[detailStyles.includesText, { color: colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={detailStyles.includesCol}>
                <Text style={[detailStyles.includesTitle, { color: colors.text }]}>{"Не включено"}</Text>
                {tour.excludes.map((item, i) => (
                  <View key={i} style={detailStyles.includesItem}>
                    <X size={14} color={colors.textMuted} />
                    <Text style={[detailStyles.includesText, { color: colors.textMuted }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={detailStyles.infoCards}>
              {tour.startTime ? (
                <View style={[detailStyles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                  <View style={[detailStyles.infoCardIcon, { backgroundColor: colors.tealSoft }]}>
                    <Clock size={16} color={colors.teal} />
                  </View>
                  <View style={detailStyles.infoCardContent}>
                    <Text style={[detailStyles.infoCardLabel, { color: colors.textMuted }]}>{"НАЧАЛО ТУРА"}</Text>
                    <Text style={[detailStyles.infoCardValue, { color: colors.text }]}>{tour.startTime}</Text>
                  </View>
                </View>
              ) : null}
              <View style={[detailStyles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                <View style={[detailStyles.infoCardIcon, { backgroundColor: colors.tealSoft }]}>
                  <Calendar size={16} color={colors.teal} />
                </View>
                <View style={detailStyles.infoCardContent}>
                  <Text style={[detailStyles.infoCardLabel, { color: colors.textMuted }]}>{"РАСПИСАНИЕ"}</Text>
                  <Text style={[detailStyles.infoCardValue, { color: colors.text }]}>{tour.schedule}</Text>
                </View>
              </View>
              <View style={[detailStyles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                <View style={[detailStyles.infoCardIcon, { backgroundColor: colors.tealSoft }]}>
                  <Users size={16} color={colors.teal} />
                </View>
                <View style={detailStyles.infoCardContent}>
                  <Text style={[detailStyles.infoCardLabel, { color: colors.textMuted }]}>{"ГРУППА"}</Text>
                  <Text style={[detailStyles.infoCardValue, { color: colors.text }]}>{tour.groupSize}</Text>
                </View>
              </View>
              <View style={[detailStyles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                <View style={[detailStyles.infoCardIcon, { backgroundColor: colors.tealSoft }]}>
                  <Globe size={16} color={colors.teal} />
                </View>
                <View style={detailStyles.infoCardContent}>
                  <Text style={[detailStyles.infoCardLabel, { color: colors.textMuted }]}>{"ЯЗЫКИ"}</Text>
                  <Text style={[detailStyles.infoCardValue, { color: colors.text }]}>{tour.languages.join(", ")}</Text>
                </View>
              </View>
              {tour.meetingPoint ? (
                <TouchableOpacity
                  style={[detailStyles.infoCard, detailStyles.meetingPointCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, borderColor: colors.teal + "30" }]}
                  onPress={() => handleMeetingPointPress(tour.meetingPoint!, tour.meetingPointCoords)}
                  activeOpacity={0.7}
                  testID={`meeting-point-${tour.id}`}
                >
                  <View style={[detailStyles.infoCardIcon, { backgroundColor: colors.tealSoft }]}>
                    <Navigation size={16} color={colors.teal} />
                  </View>
                  <View style={detailStyles.infoCardContent}>
                    <Text style={[detailStyles.infoCardLabel, { color: colors.textMuted }]}>{"МЕСТО ВСТРЕЧИ"}</Text>
                    <Text style={[detailStyles.infoCardValue, { color: colors.teal }]}>{tour.meetingPoint}</Text>
                    <Text style={[detailStyles.meetingPointHint, { color: colors.tealDark }]}>{"Нажмите, чтобы открыть на карте →"}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            {(tour.bookingConditions || tour.prepayment || tour.cancellationPolicy || tour.groupJoiningConditions) ? (
              <View style={detailStyles.policiesSection}>
                <Text style={[detailStyles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>{"Условия и политика"}</Text>
                {tour.bookingConditions ? (
                  <PolicySection
                    icon={FileText}
                    iconColor={colors.teal}
                    iconBg={colors.tealSoft}
                    title="Условия бронирования"
                    text={tour.bookingConditions}
                    colors={colors}
                  />
                ) : null}
                {tour.prepayment ? (
                  <PolicySection
                    icon={CreditCard}
                    iconColor={colors.orange}
                    iconBg={colors.orangeLight}
                    title="Предоплата"
                    text={tour.prepayment}
                    colors={colors}
                  />
                ) : null}
                {tour.cancellationPolicy ? (
                  <PolicySection
                    icon={Ban}
                    iconColor={colors.red}
                    iconBg="rgba(231,76,60,0.08)"
                    title="Условия отмены"
                    text={tour.cancellationPolicy}
                    colors={colors}
                  />
                ) : null}
                {tour.groupJoiningConditions ? (
                  <PolicySection
                    icon={UserPlus}
                    iconColor={colors.green}
                    iconBg={colors.greenLight}
                    title="Присоединение к группе"
                    text={tour.groupJoiningConditions}
                    colors={colors}
                  />
                ) : null}
              </View>
            ) : null}

            <View style={[detailStyles.organizerCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Image source={{ uri: tour.organizer.avatar }} style={[detailStyles.organizerAvatar, { backgroundColor: colors.surfaceSecondary }]} contentFit="cover" />
              <View style={detailStyles.organizerDetails}>
                <View style={detailStyles.organizerNameRow}>
                  <Text style={[detailStyles.organizerLabel, { color: colors.textMuted }]}>{"Организатор"}</Text>
                  {tour.organizer.verified ? <ShieldCheck size={14} color={colors.teal} /> : null}
                </View>
                <Text style={[detailStyles.organizerName, { color: colors.text }]}>{tour.organizer.name}</Text>
                <StarRating rating={tour.organizer.rating} reviewCount={tour.organizer.reviewCount} size={13} />
                <Text style={[detailStyles.organizerTours, { color: colors.textMuted }]}>{`${tour.organizer.toursCount} экскурсий на платформе`}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>

            {tour.reviews.length > 0 ? (
              <View style={detailStyles.section}>
                <View style={detailStyles.reviewsHeader}>
                  <Text style={[detailStyles.sectionTitle, { color: colors.text }]}>{"Отзывы"}</Text>
                  <View style={detailStyles.overallRating}>
                    <Star size={16} color={colors.gold} fill={colors.gold} />
                    <Text style={[detailStyles.overallRatingText, { color: colors.text }]}>{String(tour.organizer.rating)}</Text>
                    <Text style={[detailStyles.overallRatingCount, { color: colors.textMuted }]}>{`(${tour.organizer.reviewCount})`}</Text>
                  </View>
                </View>
                {tour.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </View>
            ) : null}

            <View style={detailStyles.actionsRow}>
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }, liked && { backgroundColor: colors.coral + "15", borderColor: colors.coral + "40" }]}
                onPress={() => handleFavorite(tour.id)}
                activeOpacity={0.7}
                testID={`detail-fav-${tour.id}`}
              >
                <Heart size={20} color={liked ? "#FFFFFF" : colors.coral} fill={liked ? colors.coral : "transparent"} />
                <Text style={[detailStyles.actionText, { color: colors.textSecondary }, liked && { color: colors.coral }]}>{liked ? "В избранном" : "В избранное"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => void handleShare(tour)}
                activeOpacity={0.7}
                testID={`detail-share-${tour.id}`}
              >
                <Share2 size={20} color={colors.teal} />
                <Text style={[detailStyles.actionText, { color: colors.textSecondary }]}>{"Поделиться"}</Text>
              </TouchableOpacity>
            </View>

            {similarTours.length > 0 ? (
              <View style={detailStyles.similarSection}>
                <Text style={[detailStyles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>{"Похожие туры"}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detailStyles.similarList}>
                  {similarTours.map((st) => (
                    <SimilarTourCard key={st.id} tour={st} onPress={() => handleSimilarTourPress(st.id)} />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[detailStyles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View style={detailStyles.stickyPriceSection}>
            {hasDiscount ? (
              <Text style={[detailStyles.stickyOriginalPrice, { color: colors.textMuted }]}>{`${tour.originalPrice!.toLocaleString()}\u20BD`}</Text>
            ) : null}
            <Text style={[detailStyles.stickyPrice, { color: colors.text }]}>{`${tour.price.toLocaleString()} ${tour.currency}`}</Text>
            <Text style={[detailStyles.stickyPriceNote, { color: colors.textMuted }]}>{"за человека"}</Text>
          </View>
          <TouchableOpacity
            style={[detailStyles.bookButton, { backgroundColor: colors.teal }]}
            activeOpacity={0.8}
            testID={`book-btn-${tour.id}`}
            onPress={() => handleBookPress(tour)}
          >
            <Text style={detailStyles.bookButtonText}>{"Забронировать"}</Text>
            {hasDiscount ? (
              <View style={[detailStyles.bookDiscountBadge, { backgroundColor: colors.green }]}>
                <Text style={detailStyles.bookDiscountText}>{`-${discountPercent}%`}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [isFavorite, handleFavorite, handleShare, handleMeetingPointPress, handleBookPress, handleSimilarTourPress, insets.bottom, colors]);

  if (tourList.length === 0) {
    return (
      <View style={[detailStyles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[detailStyles.errorText, { color: colors.textMuted }]}>{"Экскурсия не найдена"}</Text>
      </View>
    );
  }

  return (
    <View style={[detailStyles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={tourList}
        keyExtractor={(item) => item.id}
        renderItem={renderTourPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_d, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        testID="tour-detail-swiper"
      />
      <View style={[detailStyles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={detailStyles.backButton} onPress={handleBack} activeOpacity={0.7} testID="back-button">
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        {tourList.length > 1 ? (
          <View style={detailStyles.paginationContainer}>
            <Text style={detailStyles.paginationText}>{`${currentIndex + 1} / ${tourList.length}`}</Text>
          </View>
        ) : null}
      </View>
      <MapPickerModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        meetingPoint={mapModalData.meetingPoint}
        coords={mapModalData.coords}
      />
      <BookingAuthModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        tour={bookingTour}
        onBookingComplete={handleBookingComplete}
      />
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1 },
  page: { flex: 1 },
  pageContent: { paddingBottom: 100 },
  galleryContainer: { position: "relative" },
  galleryImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.6 },
  dotsContainer: {
    position: "absolute", bottom: 28, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#FFFFFF", width: 20 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(27, 40, 56, 0.7)", alignItems: "center", justifyContent: "center",
  },
  paginationContainer: {
    backgroundColor: "rgba(27, 40, 56, 0.7)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
  },
  paginationText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" as const },
  contentSection: {
    padding: 20, marginTop: -20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  topBadgesRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  bestsellerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FF6B6B", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  bestsellerText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" as const },
  sellOutBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  sellOutText: { fontSize: 12, fontWeight: "600" as const },
  tourTitle: { fontSize: 24, fontWeight: "800" as const, lineHeight: 30, marginBottom: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13, fontWeight: "500" as const },
  interestBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  interestText: { fontSize: 12, fontWeight: "600" as const },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  featureText: { fontSize: 12, fontWeight: "600" as const },
  description: { fontSize: 15, lineHeight: 23, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, marginBottom: 12 },
  highlightItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  highlightDot: { width: 6, height: 6, borderRadius: 3 },
  highlightText: { fontSize: 14 },
  whatToBringSection: {
    padding: 16, borderRadius: 16, marginBottom: 20,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  whatToBringHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  whatToBringIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  whatToBringSectionTitle: { fontSize: 16, fontWeight: "700" as const },
  whatToBringList: { gap: 8 },
  whatToBringItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  whatToBringText: { fontSize: 14, flex: 1 },
  includesSection: {
    flexDirection: "row", gap: 16, marginBottom: 20,
    padding: 16, borderRadius: 16,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  includesCol: { flex: 1 },
  includesTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 10 },
  includesItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  includesText: { fontSize: 13, flex: 1 },
  infoCards: { gap: 10, marginBottom: 20 },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  infoCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoCardContent: { flex: 1 },
  infoCardLabel: { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.3 },
  infoCardValue: { fontSize: 13, fontWeight: "600" as const, marginTop: 1 },
  meetingPointCard: { borderWidth: 1 },
  meetingPointHint: { fontSize: 11, marginTop: 3, fontWeight: "500" as const },
  policiesSection: { marginBottom: 20 },
  policyItem: {
    flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, marginBottom: 10,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  policyIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  policyTextWrap: { flex: 1 },
  policyTitle: { fontSize: 14, fontWeight: "600" as const, marginBottom: 4 },
  policyText: { fontSize: 13, lineHeight: 19 },
  organizerCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, marginBottom: 20,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  organizerAvatar: { width: 52, height: 52, borderRadius: 26 },
  organizerDetails: { flex: 1 },
  organizerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  organizerLabel: { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  organizerName: { fontSize: 16, fontWeight: "700" as const, marginBottom: 3, marginTop: 2 },
  organizerTours: { fontSize: 12, marginTop: 3 },
  reviewsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overallRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  overallRatingText: { fontSize: 16, fontWeight: "700" as const },
  overallRatingCount: { fontSize: 13 },
  reviewCard: {
    padding: 14, borderRadius: 14, marginBottom: 10,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewAuthorInfo: { flex: 1, marginLeft: 10 },
  reviewAuthor: { fontSize: 14, fontWeight: "600" as const },
  reviewDate: { fontSize: 11, marginTop: 1 },
  reviewRating: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reviewRatingText: { fontSize: 13, fontWeight: "700" as const },
  reviewText: { fontSize: 13, lineHeight: 19 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  actionText: { fontSize: 14, fontWeight: "600" as const },
  similarSection: { marginBottom: 20 },
  similarList: { gap: 12 },
  similarCard: {
    width: 170, borderRadius: 14, overflow: "hidden",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  similarImage: { width: 170, height: 100 },
  similarContent: { padding: 10 },
  similarTitle: { fontSize: 13, fontWeight: "600" as const, lineHeight: 17 },
  similarMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  similarCity: { fontSize: 11 },
  similarPrice: { fontSize: 14, fontWeight: "700" as const, marginTop: 4 },
  stickyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 12, paddingHorizontal: 20,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  stickyPriceSection: {},
  stickyOriginalPrice: { fontSize: 12, textDecorationLine: "line-through" as const },
  stickyPrice: { fontSize: 22, fontWeight: "800" as const },
  stickyPriceNote: { fontSize: 11 },
  bookButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14,
  },
  bookButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  bookDiscountBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  bookDiscountText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" as const },
  errorText: { fontSize: 16, textAlign: "center" as const, marginTop: 100 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "700" as const, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  mapOption: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, marginBottom: 10 },
  mapIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mapEmoji: { fontSize: 22 },
  mapOptionText: { flex: 1 },
  mapOptionTitle: { fontSize: 15, fontWeight: "600" as const },
  mapOptionDesc: { fontSize: 12, marginTop: 2 },
  modalCancel: { marginTop: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600" as const },
  bookingModalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  bookingModalHandle: { alignItems: "center", marginBottom: 16 },
  bookingHandle: { width: 40, height: 4, borderRadius: 2 },
  bookingModalTitle: { fontSize: 20, fontWeight: "700" as const, marginBottom: 4 },
  bookingModalSubtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  authModeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  authModeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  authModeBtnText: { fontSize: 14, fontWeight: "600" as const },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, marginBottom: 12,
  },
  inputField: { flex: 1, fontSize: 15, padding: 0 },
  bookingSubmitBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8,
  },
  bookingSubmitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  bookingCancelBtn: { alignItems: "center", paddingVertical: 14 },
  bookingCancelText: { fontSize: 15, fontWeight: "500" as const },
});


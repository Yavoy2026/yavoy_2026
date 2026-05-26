export interface TourReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  photos?: string[];
}

export interface TourOrganizer {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  avatar: string;
  verified: boolean;
  toursCount: number;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  image: string;
  gallery: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  duration: DurationType;
  durationText: string;
  transport: TransportType;
  interest: InterestType;
  category?: CategoryType;
  season?: SeasonType;
  city: string;
  organizer: TourOrganizer;
  highlights: string[];
  includes: string[];
  excludes: string[];
  schedule: string;
  groupSize: string;
  languages: string[];
  popularity: number;
  isInstantConfirmation: boolean;
  isFreeCancellation: boolean;
  isBestseller: boolean;
  isLikelyToSellOut: boolean;
  reviews: TourReview[];
  meetingPoint?: string;
  meetingPointCoords?: { lat: number; lng: number };
  nextAvailableDate: string;
  bookingsToday: number;
  startTime?: string;
  whatToBring?: string[];
  bookingConditions?: string;
  prepayment?: string;
  cancellationPolicy?: string;
  groupJoiningConditions?: string;
}

export type DurationType = "one_day" | "multi_day";
export type TransportType = "auto" | "water" | "sea" | "bike" | "air";
export type InterestType = "city" | "educational" | "nature" | "pilgrimage";
export type CategoryType =
  | "agro"
  | "photo"
  | "ethno"
  | "parents"
  | "glamping"
  | "animals"
  | "mystic"
  | "wild_animals"
  | "wine"
  | "gastro";
export type SeasonType = "winter" | "spring" | "summer" | "autumn" | "all_year";

export type SortType = "popularity" | "price_asc" | "price_desc" | "newest";

export interface City {
  id: string;
  name: string;
  image: string;
  tourCount: number;
  description: string;
  emoji: string;
  lat?: number;
  lng?: number;
}

export interface Transaction {
  id: string;
  tourTitle: string;
  tourImage: string;
  amount: number;
  currency: string;
  date: string;
  status: "completed" | "pending" | "refunded";
}

export interface PurchasedTour {
  id: string;
  tour: Tour;
  purchaseDate: string;
  tourDate: string;
  ticketCount: number;
  confirmationCode: string;
  status: "upcoming" | "completed" | "cancelled";
}

export interface BookedTour {
  id: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  tourCity: string;
  tourDate: string;
  tourStartTime: string;
  ticketCount: number;
  totalPrice: number;
  currency: string;
  confirmationCode: string;
  status: "upcoming" | "completed";
  bookedAt: string;
  firstName: string;
  lastName: string;
  contact: string;
  organizerName: string;
  meetingPoint?: string;
}

export interface GiftCertificate {
  id: string;
  nominal: number;
  currency: string;
  fromName: string;
  toName: string;
  purchasedAt: string;
  code: string;
  isUsed: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  createdAt: string;
  activatedBy: string[];
  earnedPoints: number;
}

export interface TravelReel {
  id: string;
  title: string;
  city: string;
  tourTitle: string;
  coverImage: string;
  videoUri?: string;
  author: string;
  duration: string;
  views: string;
  likes: string;
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  story: string;
  status: "published" | "moderation" | "rejected";
  createdAt: string;
}

export type UserRole = "user" | "manager" | "admin";

export interface PartnerTour {
  id: string;
  title: string;
  partner: string;
  city: string;
  price: number;
  image: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  registeredAt: string;
  city: string;
  purchasedToursCount: number;
  role: UserRole;
}

export interface SupportMessage {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  createdAt: string;
}

export interface AdminChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorType: "user" | "partner" | "admin";
  content: string;
  createdAt: string;
}

export type PartnerEntityType = "company" | "ip" | "self_employed";

export type PartnerApprovalStatus = "contacts_required" | "pending_approval" | "approved" | "rejected";

export interface PartnerProfile {
  inn: string;
  ogrn?: string;
  entityType: PartnerEntityType;
  legalName: string;
  ceo?: string;
  address: string;
  registeredAt: string;
  verifiedByFns: boolean;
  taxRegistrationDate?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  approvalStatus: PartnerApprovalStatus;
  rejectionReason?: string;
  approvedAt?: string;
}

export type LegalDocKey = "terms" | "privacy" | "offer";

export interface LegalDocContent {
  title: string;
  body: string;
  updatedAt: string;
}

export interface PartnerEmailNotification {
  id: string;
  partnerInn: string;
  email: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface PartnerMediaItem {
  uri: string;
  type: "image" | "video";
}

export interface PartnerTourSubmission {
  id: string;
  title: string;
  description: string;
  city: string;
  price: number;
  currency: string;
  image: string;
  media?: PartnerMediaItem[];
  duration: DurationType;
  transport: TransportType;
  interest: InterestType;
  category?: CategoryType;
  season?: SeasonType;
  groupSize: string;
  meetingPoint: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
  partnerInn: string;
}

export interface PartnerGuest {
  id: string;
  tourId: string;
  firstName: string;
  lastName: string;
  phone: string;
  tourDate: string;
  ticketCount: number;
  status: "upcoming" | "completed" | "cancelled";
}

export interface PartnerTransaction {
  id: string;
  tourId: string;
  tourTitle: string;
  amount: number;
  currency: string;
  date: string;
  guestName: string;
  status: "completed" | "pending" | "refunded";
}

export type PartnerReplyStatus = "pending" | "approved" | "rejected";

export interface PartnerReviewReply {
  id: string;
  reviewId: string;
  partnerInn: string;
  content: string;
  status: PartnerReplyStatus;
  createdAt: string;
  moderatedAt?: string;
  rejectionReason?: string;
}

export interface PartnerReview {
  id: string;
  tourId: string;
  partnerInn: string;
  author: string;
  avatar?: string;
  rating: number;
  text: string;
  createdAt: string;
  reply?: PartnerReviewReply;
}

export interface PartnerChatMessage {
  id: string;
  tourId: string;
  authorType: "client" | "partner" | "admin";
  authorName: string;
  content: string;
  createdAt: string;
}

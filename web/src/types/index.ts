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

export interface TourReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
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
  nextAvailableDate: string;
  bookingsToday: number;
  startTime?: string;
  whatToBring?: string[];
}

export interface City {
  id: string;
  name: string;
  image: string;
  tourCount: number;
  description: string;
  emoji: string;
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

export interface PartnerTourSubmission {
  id: string;
  title: string;
  city: string;
  price: number;
  image: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
}

export interface PartnerGuest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  tourTitle: string;
  tourDate: string;
  ticketCount: number;
}

export interface PartnerTransaction {
  id: string;
  tourTitle: string;
  amount: number;
  currency: string;
  date: string;
  guestName: string;
  status: "completed" | "pending" | "refunded";
}

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registeredAt: string;
  city: string;
  purchasedToursCount: number;
  role: UserRole;
}

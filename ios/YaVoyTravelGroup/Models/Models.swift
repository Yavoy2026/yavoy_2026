//
//  Models.swift
//  YaVoyTravelGroup
//

import Foundation

enum DurationType: String, CaseIterable, Identifiable {
    case oneDay = "one_day"
    case multiDay = "multi_day"
    var id: String { rawValue }
    var label: String { self == .oneDay ? "Однодневные" : "Многодневные" }
}

enum TransportType: String, CaseIterable, Identifiable {
    case auto, water, sea, bike, air
    var id: String { rawValue }
    var label: String {
        switch self {
        case .auto: return "Авто"
        case .water: return "Водные"
        case .sea: return "Морские"
        case .bike: return "Вело"
        case .air: return "Авиа"
        }
    }
    var fullLabel: String {
        switch self {
        case .auto: return "Автомобильная"
        case .water: return "Водная"
        case .sea: return "Морская"
        case .bike: return "Велосипедная"
        case .air: return "Авиа"
        }
    }
    var systemImage: String {
        switch self {
        case .auto: return "car.fill"
        case .water: return "water.waves"
        case .sea: return "ferry.fill"
        case .bike: return "bicycle"
        case .air: return "airplane"
        }
    }
}

enum InterestType: String, CaseIterable, Identifiable {
    case city, educational, nature, pilgrimage
    var id: String { rawValue }
    var label: String {
        switch self {
        case .city: return "Городские"
        case .educational: return "Познавательные"
        case .nature: return "Природные"
        case .pilgrimage: return "Паломничество"
        }
    }
    var fullLabel: String {
        switch self {
        case .city: return "Городская"
        case .educational: return "Познавательная"
        case .nature: return "Природная"
        case .pilgrimage: return "Паломничество"
        }
    }
    var systemImage: String {
        switch self {
        case .city: return "building.2.fill"
        case .educational: return "book.fill"
        case .nature: return "leaf.fill"
        case .pilgrimage: return "building.columns.fill"
        }
    }
}

enum SortType: String, CaseIterable, Identifiable {
    case popularity, newest, priceAsc, priceDesc
    var id: String { rawValue }
    var label: String {
        switch self {
        case .popularity: return "Популярные"
        case .newest: return "Новинки"
        case .priceAsc: return "Дешевле"
        case .priceDesc: return "Дороже"
        }
    }
}

struct TourReview: Identifiable {
    let id: String
    let author: String
    let avatar: String
    let rating: Int
    let text: String
    let date: String
}

struct TourOrganizer {
    let id: String
    let name: String
    let rating: Double
    let reviewCount: Int
    let avatar: String
    let verified: Bool
    let toursCount: Int
}

struct Tour: Identifiable {
    let id: String
    let title: String
    let description: String
    let image: String
    let gallery: [String]
    let price: Int
    let originalPrice: Int?
    let currency: String
    let duration: DurationType
    let durationText: String
    let transport: TransportType
    let interest: InterestType
    let city: String
    let organizer: TourOrganizer
    let highlights: [String]
    let includes: [String]
    let excludes: [String]
    let schedule: String
    let groupSize: String
    let languages: [String]
    let popularity: Int
    let isInstantConfirmation: Bool
    let isFreeCancellation: Bool
    let isBestseller: Bool
    let isLikelyToSellOut: Bool
    let reviews: [TourReview]
    let meetingPoint: String?
    let nextAvailableDate: String
    let startTime: String?
    let whatToBring: [String]
    let bookingConditions: String?
    let prepayment: String?
    let cancellationPolicy: String?

    var allImages: [String] { [image] + gallery }
    var hasDiscount: Bool { (originalPrice ?? 0) > price }
    var discountPercent: Int {
        guard let original = originalPrice, original > price else { return 0 }
        return Int((Double(original - price) / Double(original) * 100).rounded())
    }
}

struct City: Identifiable {
    let id: String
    let name: String
    let image: String
    let tourCount: Int
    let description: String
    let emoji: String
}

struct Transaction: Identifiable {
    let id: String
    let tourTitle: String
    let tourImage: String
    let amount: Int
    let currency: String
    let date: String
    let status: String
}

struct BookedTour: Identifiable {
    let id: String
    let tourId: String
    let tourTitle: String
    let tourImage: String
    let tourDate: String
    let tourStartTime: String
    let ticketCount: Int
    let totalPrice: Int
    let currency: String
    let confirmationCode: String
    let status: String
    let firstName: String
    let lastName: String
    let contact: String
    let organizerName: String
}

struct TravelReel: Identifiable {
    let id: String
    let title: String
    let city: String
    let tourTitle: String
    let coverImage: String
    let author: String
    let duration: String
    let views: String
    let likes: String
    var likedByMe: Bool
    let story: String
    var status: ReelStatus
}

enum ReelStatus: String {
    case published, moderation, rejected
}

enum UserRole: String, CaseIterable {
    case user, manager, admin
    var label: String {
        switch self {
        case .user: return "Пользователь"
        case .manager: return "Менеджер"
        case .admin: return "Админ"
        }
    }
}

struct AdminUser: Identifiable {
    let id: String
    let firstName: String
    let lastName: String
    let phone: String
    let email: String
    let registeredAt: String
    let city: String
    let purchasedToursCount: Int
    var role: UserRole
}

// MARK: - Partner

enum PartnerEntityType: String {
    case company, ip, selfEmployed
    var label: String {
        switch self {
        case .company: return "ООО"
        case .ip: return "ИП"
        case .selfEmployed: return "Самозанятый"
        }
    }
}

enum PartnerApprovalStatus: String {
    case contactsRequired, pendingApproval, approved, rejected
}

struct PartnerProfile {
    var inn: String
    var ogrn: String?
    var entityType: PartnerEntityType
    var legalName: String
    var ceo: String?
    var address: String
    var verifiedByFns: Bool
    var email: String?
    var phone: String?
    var telegram: String?
    var approvalStatus: PartnerApprovalStatus
}

enum LegalDocKey: String, CaseIterable, Identifiable {
    case terms, privacy, offer
    var id: String { rawValue }
}

struct LegalDocContent {
    var title: String
    var body: String
    var updatedAt: String
}

enum SubmissionStatus: String {
    case pending, published, rejected
    var label: String {
        switch self {
        case .pending: return "На модерации"
        case .published: return "Опубликован"
        case .rejected: return "Отклонён"
        }
    }
}

struct PartnerTourSubmission: Identifiable {
    let id: String
    var title: String
    var description: String
    var city: String
    var price: Int
    var currency: String
    var image: String
    var duration: DurationType
    var transport: TransportType
    var interest: InterestType
    var groupSize: String
    var meetingPoint: String
    var status: SubmissionStatus
    var submittedAt: String
    var partnerInn: String
}

struct PartnerGuest: Identifiable {
    let id: String
    let tourId: String
    let firstName: String
    let lastName: String
    let phone: String
    let tourDate: String
    let ticketCount: Int
    let status: String
}

struct PartnerTransaction: Identifiable {
    let id: String
    let tourId: String
    let tourTitle: String
    let amount: Int
    let currency: String
    let date: String
    let guestName: String
    let status: String
}

enum ReplyStatus: String {
    case pending, approved, rejected
}

struct PartnerReviewReply {
    let id: String
    let reviewId: String
    var content: String
    var status: ReplyStatus
    var createdAt: String
}

struct PartnerReview: Identifiable {
    let id: String
    let tourId: String
    let partnerInn: String
    let author: String
    let rating: Int
    let text: String
    let createdAt: String
    var reply: PartnerReviewReply?
}

struct PartnerChatMessage: Identifiable {
    let id: String
    let tourId: String
    let authorType: String
    let authorName: String
    let content: String
    let createdAt: String
}

struct PartnerEmailNotification: Identifiable {
    let id: String
    let email: String
    let subject: String
    let body: String
    let sentAt: String
}

//
//  PartnersStore.swift
//  YaVoyTravelGroup
//

import SwiftUI
import Observation

@MainActor
@Observable
final class PartnersStore {
    var profile: PartnerProfile?
    var verifying: Bool = false
    var pendingPartners: [PartnerProfile] = []
    var tours: [PartnerTourSubmission] = []
    var guests: [PartnerGuest] = []
    var transactions: [PartnerTransaction] = []
    var chat: [PartnerChatMessage] = []
    var reviews: [PartnerReview] = []
    var emailNotifications: [PartnerEmailNotification] = []
    var registrationText: String = "Введите ИНН или ОГРН компании, индивидуального предпринимателя или самозанятого. Мы проверим данные через API Федеральной налоговой службы."
    var legalDocs: [LegalDocKey: LegalDocContent] = [:]

    var isRegistered: Bool { profile != nil }
    var isApproved: Bool { profile?.approvalStatus == .approved }

    init() {
        legalDocs = Self.defaultDocs
        tours = Self.initialTours
        guests = Self.initialGuests
        transactions = Self.initialTransactions
        chat = Self.initialChat
        reviews = Self.initialReviews
    }

    // MARK: FNS verification

    func verifyAndRegister(_ value: String) async -> String? {
        verifying = true
        defer { verifying = false }
        try? await Task.sleep(for: .milliseconds(1200))
        let digits = value.filter { $0.isNumber }
        guard [10, 12, 13, 15].contains(digits.count) else {
            return "Неверный формат. Введите ИНН (10/12 цифр) или ОГРН (13/15 цифр)."
        }
        let isOgrn = digits.count == 13 || digits.count == 15
        let type: PartnerEntityType = (digits.count == 10 || digits.count == 13) ? .company : (digits.count == 12 ? .ip : .selfEmployed)
        let names: [PartnerEntityType: String] = [
            .company: "ООО «Тревел Партнёр»",
            .ip: "ИП Иванов Иван Иванович",
            .selfEmployed: "Самозанятый Петров П. П.",
        ]
        profile = PartnerProfile(
            inn: isOgrn ? String(digits.prefix(10)) : digits,
            ogrn: isOgrn ? digits : nil,
            entityType: type,
            legalName: names[type] ?? "Организация",
            ceo: type == .company ? "Иванов И. И." : nil,
            address: "Россия, г. Москва, ул. Тверская, 1",
            verifiedByFns: true,
            email: nil, phone: nil, telegram: nil,
            approvalStatus: .contactsRequired
        )
        return nil
    }

    func submitContacts(email: String, phone: String, telegram: String) {
        guard var p = profile else { return }
        p.email = email.trimmingCharacters(in: .whitespaces)
        p.phone = phone.trimmingCharacters(in: .whitespaces)
        p.telegram = telegram.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "@", with: "")
        p.approvalStatus = .pendingApproval
        profile = p
        pendingPartners.removeAll { $0.inn == p.inn }
        pendingPartners.append(p)
    }

    func approvePartner(_ inn: String) {
        if let target = pendingPartners.first(where: { $0.inn == inn }), let email = target.email {
            emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)", email: email, subject: "Ваш партнёрский аккаунт YAVOY подтверждён", body: "Здравствуйте! Ваш аккаунт партнёра (ИНН \(inn)) успешно подтверждён администратором YAVOY.", sentAt: nowString()))
        }
        pendingPartners.removeAll { $0.inn == inn }
        if profile?.inn == inn { profile?.approvalStatus = .approved }
    }

    func rejectPartner(_ inn: String) {
        if let target = pendingPartners.first(where: { $0.inn == inn }), let email = target.email {
            emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)", email: email, subject: "Заявка партнёра YAVOY отклонена", body: "Здравствуйте! К сожалению, ваша заявка партнёра (ИНН \(inn)) отклонена.", sentAt: nowString()))
        }
        pendingPartners.removeAll { $0.inn == inn }
        if profile?.inn == inn { profile?.approvalStatus = .rejected }
    }

    func logout() { profile = nil }

    // MARK: Tours

    func submitTour(_ tour: PartnerTourSubmission) {
        var t = tour
        t.partnerInn = profile?.inn ?? ""
        tours.insert(t, at: 0)
    }

    // MARK: Chat

    func sendChatMessage(tourId: String, content: String) {
        let trimmed = content.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        chat.append(PartnerChatMessage(id: "pcm-\(UUID().uuidString)", tourId: tourId, authorType: "partner", authorName: "Вы (партнёр)", content: trimmed, createdAt: nowString()))
    }

    // MARK: Reviews

    var ownerReviews: [PartnerReview] {
        let inn = profile?.inn ?? "7707123456"
        return reviews.filter { $0.partnerInn == inn }
    }

    var partnerRating: (average: Double, count: Int) {
        let list = ownerReviews
        guard !list.isEmpty else { return (0, 0) }
        let sum = list.reduce(0) { $0 + $1.rating }
        return ((Double(sum) / Double(list.count) * 10).rounded() / 10, list.count)
    }

    var pendingReplies: [PartnerReview] { reviews.filter { $0.reply?.status == .pending } }

    func submitReviewReply(reviewId: String, content: String) {
        let trimmed = content.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, let idx = reviews.firstIndex(where: { $0.id == reviewId }) else { return }
        reviews[idx].reply = PartnerReviewReply(id: "prep-\(UUID().uuidString)", reviewId: reviewId, content: trimmed, status: .pending, createdAt: dateString())
    }

    func approveReply(_ reviewId: String) {
        guard let idx = reviews.firstIndex(where: { $0.id == reviewId }) else { return }
        reviews[idx].reply?.status = .approved
    }

    func rejectReply(_ reviewId: String) {
        guard let idx = reviews.firstIndex(where: { $0.id == reviewId }) else { return }
        reviews[idx].reply?.status = .rejected
    }

    func guests(for tourId: String) -> [PartnerGuest] { guests.filter { $0.tourId == tourId } }
    func chat(for tourId: String) -> [PartnerChatMessage] { chat.filter { $0.tourId == tourId } }

    // MARK: Docs

    func updateLegalDoc(_ key: LegalDocKey, title: String, body: String, notify: Bool) {
        legalDocs[key] = LegalDocContent(title: title, body: body, updatedAt: dateString())
        if notify {
            let recipients = ([profile].compactMap { $0 } + pendingPartners).filter { $0.email != nil }
            for r in recipients {
                emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)-\(r.inn)", email: r.email!, subject: "Обновление документа: \(title)", body: "Здравствуйте! Документ «\(title)» был обновлён администратором YAVOY.", sentAt: nowString()))
            }
        }
    }

    // MARK: Stats

    struct Stats {
        let week: Int, month: Int, halfYear: Int, year: Int, all: Int
        let published: Int, pending: Int
    }

    var stats: Stats {
        let completed = transactions.filter { $0.status == "completed" }
        let now = Date()
        func sumSince(_ days: Int) -> Int {
            let cutoff = now.addingTimeInterval(-Double(days) * 86400)
            let fmt = DateFormatter(); fmt.dateFormat = "yyyy-MM-dd"
            return completed.filter { (fmt.date(from: $0.date) ?? .distantPast) >= cutoff }.reduce(0) { $0 + $1.amount }
        }
        return Stats(
            week: sumSince(7), month: sumSince(30), halfYear: sumSince(182), year: sumSince(365),
            all: completed.reduce(0) { $0 + $1.amount },
            published: tours.filter { $0.status == .published }.count,
            pending: tours.filter { $0.status == .pending }.count
        )
    }

    // MARK: Helpers

    private func nowString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd HH:mm"; return f.string(from: Date())
    }
    private func dateString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date())
    }
}

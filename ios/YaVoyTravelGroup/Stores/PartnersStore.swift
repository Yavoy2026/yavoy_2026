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
            address: "Узбекистан, г. Ташкент, ул. Амира Темура, 1",
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
            emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)", email: email, subject: "Ваш партнёрский аккаунт YAVAY подтверждён", body: "Здравствуйте! Ваш аккаунт партнёра (ИНН \(inn)) успешно подтверждён администратором YAVAY.", sentAt: nowString()))
        }
        pendingPartners.removeAll { $0.inn == inn }
        if profile?.inn == inn { profile?.approvalStatus = .approved }
    }

    func rejectPartner(_ inn: String) {
        if let target = pendingPartners.first(where: { $0.inn == inn }), let email = target.email {
            emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)", email: email, subject: "Заявка партнёра YAVAY отклонена", body: "Здравствуйте! К сожалению, ваша заявка партнёра (ИНН \(inn)) отклонена.", sentAt: nowString()))
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
        let inn = profile?.inn ?? "301234567"
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
                emailNotifications.append(PartnerEmailNotification(id: "mail-\(UUID().uuidString)-\(r.inn)", email: r.email!, subject: "Обновление документа: \(title)", body: "Здравствуйте! Документ «\(title)» был обновлён администратором YAVAY.", sentAt: nowString()))
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

    // MARK: Static demo data (mirrors expo PartnersProvider)

    private static let defaultDocs: [LegalDocKey: LegalDocContent] = [
        .terms: LegalDocContent(
            title: "Пользовательское соглашение",
            body: "1. ОБЩИЕ ПОЛОЖЕНИЯ\n\n1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между ООО «YAVAY» (далее — Платформа) и Партнёром при использовании сервиса YAVAY Travel Group.\n\n1.2. Регистрируясь в качестве Партнёра, вы подтверждаете, что ознакомились с условиями Соглашения и принимаете их в полном объёме.\n\n2. ПРЕДМЕТ СОГЛАШЕНИЯ\n\n2.1. Платформа предоставляет Партнёру технологический сервис для размещения и продажи экскурсий, а Партнёр обязуется размещать достоверную информацию и предоставлять услуги надлежащего качества.\n\n3. ПРАВА И ОБЯЗАННОСТИ СТОРОН\n\n3.1. Партнёр обязуется: предоставлять актуальную информацию, своевременно отвечать на запросы клиентов, соблюдать законодательство Республики Узбекистан.\n\n4. ОТВЕТСТВЕННОСТЬ\n\n4.1. Партнёр несёт ответственность за достоверность сведений о компании, ИНН/ОГРН и налоговом статусе.\n\n5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ\n\n5.1. Соглашение вступает в силу с момента акцепта и действует бессрочно.\n\n5.2. Платформа вправе изменять условия с уведомлением Партнёра за 10 дней.",
            updatedAt: "2026-05-01"
        ),
        .privacy: LegalDocContent(
            title: "Политика конфиденциальности",
            body: "1. Действуя свободно, своей волей и в своём интересе, Партнёр даёт согласие ООО «YAVAY» на обработку своих персональных данных в соответствии с Законом Республики Узбекистан «О персональных данных».\n\n2. Состав персональных данных: ФИО, ИНН, ОГРН, юридический и фактический адрес, контактные телефоны, адрес электронной почты, банковские реквизиты, сведения о государственной регистрации.\n\n3. Цели обработки: идентификация Партнёра, заключение и исполнение договора, проведение взаиморасчётов, маркетинговая аналитика, обеспечение работы сервиса, рассылка уведомлений.\n\n4. Партнёр согласен на передачу персональных данных третьим лицам, привлекаемым Платформой для оказания услуг (налоговые органы, банки-эквайеры, операторы фискальных данных, сервисы рассылок).\n\n5. Согласие действует с момента акцепта и до момента его отзыва Партнёром письменным заявлением.",
            updatedAt: "2026-05-01"
        ),
        .offer: LegalDocContent(
            title: "Договор оферты",
            body: "1. ПРЕДМЕТ ДОГОВОРА\n\n1.1. ООО «YAVAY» (Платформа) предлагает Партнёру заключить договор на использование платформы YAVAY Travel Group для размещения и продажи экскурсий конечным клиентам.\n\n1.2. Настоящий документ является публичной офертой в соответствии с законодательством Республики Узбекистан.\n\n2. ПОРЯДОК АКЦЕПТА\n\n2.1. Акцептом оферты считается прохождение Партнёром процедуры регистрации, включая подтверждение настоящего согласия и проверку через налоговые органы.\n\n3. ВОЗНАГРАЖДЕНИЕ ПЛАТФОРМЫ\n\n3.1. Платформа удерживает комиссию в размере 15% от стоимости каждой оплаченной экскурсии.\n\n3.2. Выплаты Партнёру осуществляются раз в неделю на указанный расчётный счёт.\n\n4. ОБЯЗАННОСТИ ПАРТНЁРА\n\n4.1. Размещение достоверной информации об экскурсии.\n\n4.2. Своевременное проведение экскурсии в соответствии с расписанием.\n\n4.3. Реагирование на отзывы и обращения клиентов.\n\n5. СРОК ДЕЙСТВИЯ\n\n5.1. Договор заключается на неопределённый срок и действует до момента расторжения одной из сторон.",
            updatedAt: "2026-05-01"
        ),
    ]

    private static let initialTours: [PartnerTourSubmission] = [
        PartnerTourSubmission(
            id: "psub1",
            title: "Гастротур по базарам и чайханам Бухары",
            description: "Дегустации специй, мастер-класс по плову и виноделие региона Зарафшан.",
            city: "Бухара",
            price: 850000,
            currency: "сум",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
            duration: .oneDay,
            transport: .auto,
            interest: .city,
            groupSize: "до 12 человек",
            meetingPoint: "Бухара, ансамбль Ляби-Хауз, 1",
            status: .published,
            submittedAt: "2026-04-12",
            partnerInn: "301234567"
        ),
        PartnerTourSubmission(
            id: "psub2",
            title: "Восхождение на Большой Чимган",
            description: "Маршрут средней сложности с гидом и фотосессией на вершине.",
            city: "Чимган и Чарвак",
            price: 420000,
            currency: "сум",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
            duration: .oneDay,
            transport: .auto,
            interest: .nature,
            groupSize: "до 15 человек",
            meetingPoint: "Чимган, у канатной дороги",
            status: .pending,
            submittedAt: "2026-05-18",
            partnerInn: "301234567"
        ),
    ]

    private static let initialGuests: [PartnerGuest] = [
        PartnerGuest(id: "pg1", tourId: "psub1", firstName: "Анна", lastName: "Соколова", phone: "+998 (91) 222-08-91", tourDate: "2026-04-20", ticketCount: 2, status: "completed"),
        PartnerGuest(id: "pg2", tourId: "psub1", firstName: "Дмитрий", lastName: "Кузнецов", phone: "+998 (93) 401-77-12", tourDate: "2026-05-04", ticketCount: 3, status: "completed"),
        PartnerGuest(id: "pg3", tourId: "psub1", firstName: "Мария", lastName: "Орлова", phone: "+998 (94) 678-34-09", tourDate: "2026-06-12", ticketCount: 4, status: "upcoming"),
        PartnerGuest(id: "pg4", tourId: "psub2", firstName: "Сергей", lastName: "Васильев", phone: "+998 (97) 999-12-77", tourDate: "2026-06-22", ticketCount: 2, status: "upcoming"),
    ]

    private static let initialTransactions: [PartnerTransaction] = [
        PartnerTransaction(id: "ptr1", tourId: "psub1", tourTitle: "Гастротур по базарам и чайханам Бухары", amount: 1700000, currency: "сум", date: "2026-04-20", guestName: "Анна Соколова", status: "completed"),
        PartnerTransaction(id: "ptr2", tourId: "psub1", tourTitle: "Гастротур по базарам и чайханам Бухары", amount: 2550000, currency: "сум", date: "2026-05-04", guestName: "Дмитрий Кузнецов", status: "completed"),
        PartnerTransaction(id: "ptr3", tourId: "psub1", tourTitle: "Гастротур по базарам и чайханам Бухары", amount: 3400000, currency: "сум", date: "2026-05-20", guestName: "Мария Орлова", status: "pending"),
        PartnerTransaction(id: "ptr4", tourId: "psub2", tourTitle: "Восхождение на Большой Чимган", amount: 840000, currency: "сум", date: "2026-05-22", guestName: "Сергей Васильев", status: "pending"),
        PartnerTransaction(id: "ptr5", tourId: "psub1", tourTitle: "Гастротур по базарам и чайханам Бухары", amount: 850000, currency: "сум", date: "2026-03-12", guestName: "Игорь Лебедев", status: "completed"),
        PartnerTransaction(id: "ptr6", tourId: "psub1", tourTitle: "Гастротур по базарам и чайханам Бухары", amount: 1700000, currency: "сум", date: "2025-12-10", guestName: "Наталья Котова", status: "completed"),
    ]

    private static let initialChat: [PartnerChatMessage] = [
        PartnerChatMessage(id: "pcm1", tourId: "psub1", authorType: "client", authorName: "Анна Соколова", content: "Здравствуйте! А во сколько собираемся в субботу?", createdAt: "2026-04-18 14:21"),
        PartnerChatMessage(id: "pcm2", tourId: "psub1", authorType: "partner", authorName: "Партнёр", content: "Добрый день! Сбор в 9:00 у бассейна Ляби-Хауз, у Надира Диван-беги.", createdAt: "2026-04-18 14:32"),
        PartnerChatMessage(id: "pcm3", tourId: "psub1", authorType: "admin", authorName: "Администратор YAVAY", content: "Подключился к диалогу для контроля качества. Всё на связи.", createdAt: "2026-04-18 14:33"),
    ]

    private static let initialReviews: [PartnerReview] = [
        PartnerReview(
            id: "pr1", tourId: "psub1", partnerInn: "301234567", author: "Анна Соколова", rating: 5,
            text: "Невероятно вкусно и познавательно! Базары Бухары — восторг.", createdAt: "2026-04-21",
            reply: PartnerReviewReply(id: "prep1", reviewId: "pr1", content: "Спасибо, ждём вас снова на наших турах!", status: .approved, createdAt: "2026-04-22")
        ),
        PartnerReview(
            id: "pr2", tourId: "psub1", partnerInn: "301234567", author: "Дмитрий Кузнецов", rating: 4,
            text: "Отлично, но хотелось больше времени у каждого места.", createdAt: "2026-05-05",
            reply: PartnerReviewReply(id: "prep2", reviewId: "pr2", content: "Благодарим за отзыв! Добавим свободное время в маршрут.", status: .pending, createdAt: "2026-05-06")
        ),
        PartnerReview(
            id: "pr3", tourId: "psub1", partnerInn: "301234567", author: "Игорь Лебедев", rating: 5,
            text: "Лучший плов в жизни. Гид — настоящий знаток города.", createdAt: "2026-03-13",
            reply: nil
        ),
    ]
}

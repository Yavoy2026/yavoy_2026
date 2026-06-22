//
//  AdminStore.swift
//  YaVoyTravelGroup
//

import SwiftUI
import Observation

struct AdminChatMessage: Identifiable {
    let id: String
    let authorId: String
    let authorName: String
    let authorType: String
    let content: String
    let createdAt: String
}

struct AdminPartnerTour: Identifiable {
    let id: String
    let title: String
    let partner: String
    let city: String
    let price: Int
    let image: String
    var status: SubmissionStatus
    let submittedAt: String
}

@MainActor
@Observable
final class AdminStore {
    var isAuthenticated: Bool = false
    var users: [AdminUser] = []
    var partnerTours: [AdminPartnerTour] = []
    var userChats: [AdminChatMessage] = []
    var partnerChats: [AdminChatMessage] = []

    private let login = "admin"
    private let password = "Lotofond"

    init() {
        users = [
            AdminUser(id: "u1", firstName: "Иван", lastName: "Петров", phone: "+7 (916) 555-12-34", email: "ivan.petrov@email.com", registeredAt: "2025-08-14", city: "Москва", purchasedToursCount: 6, role: .user),
            AdminUser(id: "u2", firstName: "Анна", lastName: "Соколова", phone: "+7 (903) 222-08-91", email: "anna.sokolova@mail.ru", registeredAt: "2025-09-02", city: "Санкт-Петербург", purchasedToursCount: 11, role: .user),
            AdminUser(id: "u3", firstName: "Дмитрий", lastName: "Кузнецов", phone: "+7 (911) 401-77-12", email: "kuznetsov.dm@gmail.com", registeredAt: "2025-10-19", city: "Казань", purchasedToursCount: 2, role: .manager),
            AdminUser(id: "u4", firstName: "Мария", lastName: "Орлова", phone: "+7 (929) 678-34-09", email: "m.orlova@yandex.ru", registeredAt: "2026-01-08", city: "Сочи", purchasedToursCount: 4, role: .user),
            AdminUser(id: "u5", firstName: "Сергей", lastName: "Васильев", phone: "+7 (905) 999-12-77", email: "s.vasiliev@email.com", registeredAt: "2026-02-23", city: "Кисловодск", purchasedToursCount: 0, role: .user),
        ]
        partnerTours = [
            AdminPartnerTour(id: "pt1", title: "Гастротур по Кавказским Минеральным Водам", partner: "Кавказ Travel", city: "Кисловодск", price: 8500, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", status: .pending, submittedAt: "2026-05-10"),
            AdminPartnerTour(id: "pt2", title: "Мистический ночной Петербург", partner: "Северная Звезда", city: "Санкт-Петербург", price: 2400, image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=600&h=400&fit=crop", status: .pending, submittedAt: "2026-05-12"),
            AdminPartnerTour(id: "pt3", title: "Фототур к Куршской косе", partner: "Балтика Лайф", city: "Калининград", price: 6900, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop", status: .pending, submittedAt: "2026-05-13"),
        ]
        userChats = [
            AdminChatMessage(id: "uc1", authorId: "u1", authorName: "Иван Петров", authorType: "user", content: "Здравствуйте! Нужна помощь с возвратом средств за тур.", createdAt: "2026-05-13 10:14"),
            AdminChatMessage(id: "uc2", authorId: "admin", authorName: "Администратор", authorType: "admin", content: "Здравствуйте, Иван. Уточните номер бронирования, разберёмся в течение часа.", createdAt: "2026-05-13 10:22"),
        ]
        partnerChats = [
            AdminChatMessage(id: "pc1", authorId: "p1", authorName: "Кавказ Travel", authorType: "partner", content: "Загрузили новый гастротур, посмотрите, пожалуйста, на модерацию.", createdAt: "2026-05-13 09:40"),
            AdminChatMessage(id: "pc2", authorId: "admin", authorName: "Администратор", authorType: "admin", content: "Принято, проверим сегодня и сообщим о публикации.", createdAt: "2026-05-13 09:52"),
        ]
    }

    func attemptLogin(_ username: String, _ pass: String) -> Bool {
        let ok = username.trimmingCharacters(in: .whitespaces).lowercased() == login && pass == password
        if ok { isAuthenticated = true }
        return ok
    }

    func logout() { isAuthenticated = false }

    func setRole(_ userId: String, _ role: UserRole) {
        guard let idx = users.firstIndex(where: { $0.id == userId }) else { return }
        users[idx].role = role
    }

    func approvePartnerTour(_ id: String) {
        guard let idx = partnerTours.firstIndex(where: { $0.id == id }) else { return }
        partnerTours[idx].status = .published
    }

    func rejectPartnerTour(_ id: String) {
        guard let idx = partnerTours.firstIndex(where: { $0.id == id }) else { return }
        partnerTours[idx].status = .rejected
    }

    func sendUserChat(_ content: String) {
        let t = content.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        userChats.append(AdminChatMessage(id: "uc-\(UUID().uuidString)", authorId: "admin", authorName: "Администратор", authorType: "admin", content: t, createdAt: nowString()))
    }

    func sendPartnerChat(_ content: String) {
        let t = content.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        partnerChats.append(AdminChatMessage(id: "pc-\(UUID().uuidString)", authorId: "admin", authorName: "Администратор", authorType: "admin", content: t, createdAt: nowString()))
    }

    var totalPurchased: Int { users.reduce(0) { $0 + $1.purchasedToursCount } }
    var managersCount: Int { users.filter { $0.role == .manager }.count }
    var pendingPartnerToursCount: Int { partnerTours.filter { $0.status == .pending }.count }

    private func nowString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd HH:mm"; return f.string(from: Date())
    }
}

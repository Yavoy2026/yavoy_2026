//
//  AdminView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct AdminView: View {
    @Environment(\.palette) private var palette
    @Environment(AdminStore.self) private var admin

    var body: some View {
        Group {
            if admin.isAuthenticated {
                AdminDashboard()
            } else {
                AdminLogin()
            }
        }
        .background(palette.background)
        .navigationTitle("Администратор")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct AdminLogin: View {
    @Environment(\.palette) private var palette
    @Environment(AdminStore.self) private var admin
    @State private var username = ""
    @State private var password = ""
    @State private var error = false

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.shield.fill").font(.system(size: 48)).foregroundStyle(palette.teal)
            Text("Вход в панель").font(.system(size: 22, weight: .bold)).foregroundStyle(palette.text)

            TextField("Логин", text: $username)
                .textInputAutocapitalization(.never).autocorrectionDisabled()
                .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
            SecureField("Пароль", text: $password)
                .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }

            if error {
                Text("Неверный логин или пароль").font(.system(size: 13)).foregroundStyle(palette.red)
            }

            Button {
                if !admin.attemptLogin(username, password) { error = true }
            } label: {
                Text("Войти").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 15)
                    .background(palette.teal).clipShape(.rect(cornerRadius: 14))
            }
        }
        .padding(24)
    }
}

private struct AdminDashboard: View {
    @Environment(\.palette) private var palette
    @Environment(AdminStore.self) private var admin
    @Environment(PartnersStore.self) private var partners
    @Environment(ReelsStore.self) private var reelsStore
    @State private var tab: AdminTab = .stats

    enum AdminTab: String, CaseIterable, Identifiable {
        case stats, users, approvals, reels, partnerTours, replies, docs, emails, chatUsers, chatPartners
        var id: String { rawValue }
        var label: String {
            switch self {
            case .stats: return "Статистика"
            case .users: return "Пользователи"
            case .approvals: return "Анкеты партнёров"
            case .reels: return "Reels"
            case .partnerTours: return "Туры партнёров"
            case .replies: return "Ответы на отзывы"
            case .docs: return "Документы"
            case .emails: return "Email-рассылки"
            case .chatUsers: return "Чат: пользователи"
            case .chatPartners: return "Чат: партнёры"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(AdminTab.allCases) { t in
                            Button { tab = t } label: { ChipView(label: t.label, isActive: tab == t) }.buttonStyle(.plain)
                        }
                    }
                }
                .contentMargins(.horizontal, 0, for: .scrollContent)

                switch tab {
                case .stats: statsTab
                case .users: usersTab
                case .approvals: approvalsTab
                case .reels: reelsTab
                case .partnerTours: partnerToursTab
                case .replies: repliesTab
                case .docs: AdminDocsEditor()
                case .emails: emailsTab
                case .chatUsers: AdminChatView(isPartner: false)
                case .chatPartners: AdminChatView(isPartner: true)
                }
            }
            .padding(20)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { admin.logout() } label: { Image(systemName: "rectangle.portrait.and.arrow.right") }
            }
        }
    }

    private var statsTab: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard("Пользователей", "\(admin.users.count)", "person.2.fill", palette.teal)
            statCard("Куплено туров", "\(admin.totalPurchased)", "ticket.fill", palette.gold)
            statCard("Менеджеров", "\(admin.managersCount)", "person.badge.key.fill", palette.green)
            statCard("На модерации", "\(admin.pendingPartnerToursCount)", "clock.fill", palette.orange)
            statCard("Анкет партнёров", "\(partners.pendingPartners.count)", "doc.text.fill", palette.coral)
            statCard("Reels на модер.", "\(reelsStore.moderationReels.count)", "video.fill", palette.teal)
        }
    }

    private func statCard(_ label: String, _ value: String, _ icon: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon).font(.system(size: 22)).foregroundStyle(color)
            Text(value).font(.system(size: 26, weight: .heavy)).foregroundStyle(palette.text)
            Text(label).font(.system(size: 13)).foregroundStyle(palette.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16).background(palette.surface).clipShape(.rect(cornerRadius: 16))
    }

    private var usersTab: some View {
        VStack(spacing: 10) {
            ForEach(admin.users) { user in
                HStack(spacing: 10) {
                    Image(systemName: "person.circle.fill").font(.system(size: 34)).foregroundStyle(palette.teal)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(user.firstName) \(user.lastName)").font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                        Text(user.email).font(.system(size: 12)).foregroundStyle(palette.textMuted)
                        Text("\(user.city) · \(user.purchasedToursCount) туров").font(.system(size: 12)).foregroundStyle(palette.textSecondary)
                    }
                    Spacer()
                    Menu {
                        ForEach(UserRole.allCases, id: \.self) { role in
                            Button(role.label) { admin.setRole(user.id, role) }
                        }
                    } label: {
                        StatusBadge(text: user.role.label, color: palette.teal)
                    }
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var approvalsTab: some View {
        VStack(spacing: 10) {
            if partners.pendingPartners.isEmpty {
                emptyHint("Нет анкет на проверке")
            }
            ForEach(partners.pendingPartners, id: \.inn) { p in
                VStack(alignment: .leading, spacing: 8) {
                    Text(p.legalName).font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.text)
                    Text("ИНН: \(p.inn) · \(p.entityType.label)").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                    if let email = p.email { Text("Email: \(email)").font(.system(size: 12)).foregroundStyle(palette.textSecondary) }
                    if let phone = p.phone { Text("Тел: \(phone)").font(.system(size: 12)).foregroundStyle(palette.textSecondary) }
                    if let tg = p.telegram { Text("Telegram: @\(tg)").font(.system(size: 12)).foregroundStyle(palette.textSecondary) }
                    HStack(spacing: 10) {
                        actionBtn("Подтвердить", color: palette.green) { partners.approvePartner(p.inn) }
                        actionBtn("Отклонить", color: palette.red) { partners.rejectPartner(p.inn) }
                    }
                }
                .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
            }
        }
    }

    private var reelsTab: some View {
        VStack(spacing: 10) {
            if reelsStore.moderationReels.isEmpty { emptyHint("Нет reels на модерации") }
            ForEach(reelsStore.moderationReels) { reel in
                HStack(spacing: 10) {
                    RemoteImage(url: reel.coverImage, height: 60).frame(width: 44).clipShape(.rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(reel.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                        Text(reel.tourTitle).font(.system(size: 12)).foregroundStyle(palette.textMuted).lineLimit(1)
                    }
                    Spacer()
                    actionBtn("✓", color: palette.green) { reelsStore.approveReel(reel.id) }
                    actionBtn("✕", color: palette.red) { reelsStore.rejectReel(reel.id) }
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var partnerToursTab: some View {
        VStack(spacing: 10) {
            ForEach(admin.partnerTours) { tour in
                HStack(spacing: 10) {
                    RemoteImage(url: tour.image, height: 54).frame(width: 54).clipShape(.rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 4) {
                        Text(tour.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(2)
                        Text("\(tour.partner) · \(tour.city)").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                        StatusBadge(text: tour.status.label, color: tour.status == .published ? palette.green : (tour.status == .rejected ? palette.red : palette.orange))
                    }
                    Spacer()
                    if tour.status == .pending {
                        VStack(spacing: 6) {
                            actionBtn("✓", color: palette.green) { admin.approvePartnerTour(tour.id) }
                            actionBtn("✕", color: palette.red) { admin.rejectPartnerTour(tour.id) }
                        }
                    }
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var repliesTab: some View {
        VStack(spacing: 10) {
            if partners.pendingReplies.isEmpty { emptyHint("Нет ответов на модерации") }
            ForEach(partners.pendingReplies) { review in
                VStack(alignment: .leading, spacing: 8) {
                    Text("Отзыв от \(review.author)").font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.text)
                    Text(review.text).font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    if let reply = review.reply {
                        Text("Ответ партнёра: \(reply.content)").font(.system(size: 13)).foregroundStyle(palette.textSecondary)
                    }
                    HStack(spacing: 10) {
                        actionBtn("Опубликовать", color: palette.green) { partners.approveReply(review.id) }
                        actionBtn("Отклонить", color: palette.red) { partners.rejectReply(review.id) }
                    }
                }
                .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
            }
        }
    }

    private var emailsTab: some View {
        VStack(spacing: 10) {
            if partners.emailNotifications.isEmpty { emptyHint("Рассылок пока нет") }
            ForEach(partners.emailNotifications) { mail in
                VStack(alignment: .leading, spacing: 4) {
                    Text(mail.subject).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                    Text("Кому: \(mail.email) · \(mail.sentAt)").font(.system(size: 11)).foregroundStyle(palette.textMuted)
                    Text(mail.body).font(.system(size: 13)).foregroundStyle(palette.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
            }
        }
    }

    private func actionBtn(_ label: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label).font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                .padding(.horizontal, 14).padding(.vertical, 8).background(color).clipShape(.rect(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }

    private func emptyHint(_ text: String) -> some View {
        Text(text).font(.system(size: 14)).foregroundStyle(palette.textMuted).padding(.vertical, 30).frame(maxWidth: .infinity)
    }
}

private struct AdminDocsEditor: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @State private var key: LegalDocKey = .terms
    @State private var title = ""
    @State private var body_ = ""
    @State private var loaded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Документ", selection: $key) {
                Text("Соглашение").tag(LegalDocKey.terms)
                Text("ПД").tag(LegalDocKey.privacy)
                Text("Оферта").tag(LegalDocKey.offer)
            }
            .pickerStyle(.segmented)
            .onChange(of: key) { _, newValue in load(newValue) }

            TextField("Заголовок", text: $title)
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }

            TextEditor(text: $body_)
                .frame(height: 240).padding(8).scrollContentBackground(.hidden)
                .background(palette.surface).clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }

            HStack(spacing: 10) {
                Button {
                    partners.updateLegalDoc(key, title: title, body: body_, notify: false)
                } label: {
                    Text("Сохранить").font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.teal)
                        .frame(maxWidth: .infinity).padding(.vertical, 13)
                        .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.teal, lineWidth: 1) }
                }
                Button {
                    partners.updateLegalDoc(key, title: title, body: body_, notify: true)
                } label: {
                    Text("Сохранить и уведомить").font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 13)
                        .background(palette.teal).clipShape(.rect(cornerRadius: 12))
                }
            }
        }
        .onAppear { if !loaded { load(key); loaded = true } }
    }

    private func load(_ k: LegalDocKey) {
        if let doc = partners.legalDocs[k] {
            title = doc.title; body_ = doc.body
        }
    }
}

private struct AdminChatView: View {
    let isPartner: Bool
    @Environment(\.palette) private var palette
    @Environment(AdminStore.self) private var admin
    @State private var input = ""

    private var messages: [AdminChatMessage] { isPartner ? admin.partnerChats : admin.userChats }

    var body: some View {
        VStack(spacing: 10) {
            ForEach(messages) { msg in
                let isAdmin = msg.authorType == "admin"
                HStack {
                    if isAdmin { Spacer() }
                    VStack(alignment: .leading, spacing: 3) {
                        Text(msg.authorName).font(.system(size: 11, weight: .semibold)).foregroundStyle(isAdmin ? .white.opacity(0.8) : palette.textMuted)
                        Text(msg.content).font(.system(size: 14)).foregroundStyle(isAdmin ? .white : palette.text)
                        Text(msg.createdAt).font(.system(size: 10)).foregroundStyle(isAdmin ? .white.opacity(0.6) : palette.textMuted)
                    }
                    .padding(12).background(isAdmin ? palette.teal : palette.surface).clipShape(.rect(cornerRadius: 14))
                    .frame(maxWidth: 280, alignment: isAdmin ? .trailing : .leading)
                    if !isAdmin { Spacer() }
                }
            }
            HStack(spacing: 8) {
                TextField("Ответить...", text: $input)
                    .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                    .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
                Button {
                    if isPartner { admin.sendPartnerChat(input) } else { admin.sendUserChat(input) }
                    input = ""
                } label: {
                    Image(systemName: "paperplane.fill").foregroundStyle(.white)
                        .frame(width: 44, height: 44).background(palette.teal).clipShape(Circle())
                }
            }
        }
    }
}

//
//  ProfileView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct ProfileView: View {
    @Environment(\.palette) private var palette
    @Environment(AppStore.self) private var store
    @Environment(ReelsStore.self) private var reelsStore

    @State private var showThemeSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    profileCard
                    sectionsCard
                    menuCard
                }
                .padding(.vertical, 16)
            }
            .background(palette.background)
            .navigationTitle("Профиль")
            .navigationDestination(for: TourRoute.self) { route in
                TourDetailView(tourId: route.tourId, tourIds: route.ids)
            }
            .navigationDestination(for: String.self) { dest in
                switch dest {
                case "partner": PartnerView()
                case "admin": AdminView()
                default: EmptyView()
                }
            }
            .sheet(isPresented: $showThemeSheet) { themeSheet }
        }
    }

    private var profileCard: some View {
        VStack(spacing: 12) {
            RemoteImage(url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop", height: 80)
                .frame(width: 80).clipShape(Circle())
                .overlay { Circle().stroke(palette.teal, lineWidth: 3) }
            Text("Иван Петров").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
            Text("ivan.petrov@email.com").font(.system(size: 13)).foregroundStyle(.white.opacity(0.6))

            HStack(spacing: 0) {
                stat("\(store.bookings.count + MockData.purchasedTours.count)", "Поездки", palette.tealLight)
                divider
                stat("\(store.points)", "Баллы", palette.gold)
                divider
                stat("\(store.favoriteTourIds.count)", "Избранное", palette.tealLight)
            }
            .padding(.vertical, 14)
            .background(palette.navyLight)
            .clipShape(.rect(cornerRadius: 14))
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(palette.headerBg)
        .clipShape(.rect(cornerRadius: 20))
        .padding(.horizontal, 16)
    }

    private var divider: some View {
        Rectangle().fill(.white.opacity(0.15)).frame(width: 1, height: 36)
    }

    private func stat(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 20, weight: .heavy)).foregroundStyle(color)
            Text(label).font(.system(size: 11)).foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }

    private var sectionsCard: some View {
        VStack(spacing: 0) {
            DisclosureRow(icon: "airplane", iconBg: palette.tealSoft, iconColor: palette.teal, title: "Мои поездки", subtitle: "\(store.bookings.count + MockData.purchasedTours.count) поездок") {
                VStack(spacing: 10) {
                    ForEach(store.bookings) { bk in bookingRow(title: bk.tourTitle, image: bk.tourImage, date: bk.tourDate, code: bk.confirmationCode, upcoming: bk.status == "upcoming") }
                    ForEach(MockData.purchasedTours) { pt in bookingRow(title: pt.tourTitle, image: pt.tourImage, date: pt.tourDate, code: pt.confirmationCode, upcoming: pt.status == "upcoming") }
                }
            }
            rowDivider
            DisclosureRow(icon: "heart.fill", iconBg: palette.coral.opacity(0.12), iconColor: palette.coral, title: "Избранные туры", subtitle: "\(store.favoriteTours.count) экскурсий") {
                VStack(spacing: 10) {
                    if store.favoriteTours.isEmpty {
                        Text("Нет избранных экскурсий").font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    }
                    ForEach(store.favoriteTours) { tour in
                        NavigationLink(value: TourRoute(tourId: tour.id, ids: store.favoriteTours.map(\.id))) {
                            miniTourRow(tour)
                        }.buttonStyle(.plain)
                    }
                }
            }
            rowDivider
            DisclosureRow(icon: "video.fill", iconBg: palette.coral.opacity(0.12), iconColor: palette.coral, title: "Мои Reels", subtitle: "\(reelsStore.moderationReels.count) на модерации · +\(reelsStore.rewardPoints) баллов") {
                ReelSubmitForm()
            }
            rowDivider
            DisclosureRow(icon: "creditcard.fill", iconBg: palette.orange.opacity(0.12), iconColor: palette.orange, title: "Транзакции", subtitle: "\(MockData.transactions.count) операций") {
                VStack(spacing: 10) {
                    ForEach(MockData.transactions) { tr in transactionRow(tr) }
                }
            }
        }
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 18))
        .padding(.horizontal, 16)
    }

    private var menuCard: some View {
        VStack(spacing: 0) {
            Button { showThemeSheet = true } label: {
                menuRow(icon: "paintbrush.fill", title: "Оформление", value: store.themeMode.label)
            }
            rowDivider
            NavigationLink(value: "partner") {
                menuRow(icon: "briefcase.fill", title: "Партнёрам (B2B)", value: store.partnerBadge)
            }
            rowDivider
            NavigationLink(value: "admin") {
                menuRow(icon: "lock.shield.fill", title: "Панель администратора", value: "")
            }
        }
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 18))
        .padding(.horizontal, 16)
    }

    private var themeSheet: some View {
        NavigationStack {
            List {
                ForEach(AppThemeMode.allCases) { mode in
                    Button {
                        store.themeMode = mode; showThemeSheet = false
                    } label: {
                        HStack {
                            Image(systemName: icon(for: mode)).foregroundStyle(palette.teal)
                            Text(mode.label).foregroundStyle(palette.text)
                            Spacer()
                            if store.themeMode == mode {
                                Image(systemName: "checkmark").foregroundStyle(palette.teal)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Оформление")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium])
    }

    private func icon(for mode: AppThemeMode) -> String {
        switch mode {
        case .system: return "iphone"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }

    // MARK: rows

    private var rowDivider: some View { Divider().background(palette.border).padding(.leading, 60) }

    private func menuRow(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(palette.textSecondary).frame(width: 28)
            Text(title).font(.system(size: 15, weight: .medium)).foregroundStyle(palette.text)
            Spacer()
            if !value.isEmpty {
                Text(value).font(.system(size: 13)).foregroundStyle(palette.textMuted)
            }
            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(palette.textMuted)
        }
        .padding(16)
    }

    private func bookingRow(title: String, image: String, date: String, code: String, upcoming: Bool) -> some View {
        HStack(spacing: 10) {
            RemoteImage(url: image, height: 50).frame(width: 50).clipShape(.rect(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                HStack(spacing: 6) {
                    Image(systemName: "calendar").font(.system(size: 11)).foregroundStyle(palette.textMuted)
                    Text(date).font(.system(size: 12)).foregroundStyle(palette.textMuted)
                }
                StatusBadge(text: upcoming ? "Предстоит" : "Завершено", color: upcoming ? palette.teal : palette.green)
            }
            Spacer()
            Text(code).font(.system(size: 11)).foregroundStyle(palette.textMuted)
        }
        .padding(12)
        .background(palette.surfaceSecondary)
        .clipShape(.rect(cornerRadius: 12))
    }

    private func miniTourRow(_ tour: Tour) -> some View {
        HStack(spacing: 10) {
            RemoteImage(url: tour.image, height: 50).frame(width: 50).clipShape(.rect(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text(tour.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                Text("\(tour.price.formatted())\(tour.currency)").font(.system(size: 13, weight: .bold)).foregroundStyle(palette.teal)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(palette.textMuted)
        }
        .padding(12)
        .background(palette.surfaceSecondary)
        .clipShape(.rect(cornerRadius: 12))
    }

    private func transactionRow(_ tr: Transaction) -> some View {
        let config: (String, Color) = {
            switch tr.status {
            case "completed": return ("Оплачено", palette.green)
            case "pending": return ("В обработке", palette.orange)
            default: return ("Возврат", palette.red)
            }
        }()
        return HStack(spacing: 10) {
            RemoteImage(url: tr.tourImage, height: 44).frame(width: 44).clipShape(.rect(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text(tr.tourTitle).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                Text(tr.date).font(.system(size: 12)).foregroundStyle(palette.textMuted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(tr.status == "refunded" ? "+" : "-")\(tr.amount.formatted())\(tr.currency)")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                Text(config.0).font(.system(size: 11, weight: .semibold)).foregroundStyle(config.1)
            }
        }
        .padding(12)
        .background(palette.surfaceSecondary)
        .clipShape(.rect(cornerRadius: 12))
    }
}

private extension AppStore {
    var partnerBadge: String { "" }
}

/// Collapsible section row used in the profile screen.
struct DisclosureRow<Content: View>: View {
    let icon: String
    let iconBg: Color
    let iconColor: Color
    let title: String
    let subtitle: String
    @ViewBuilder var content: Content
    @Environment(\.palette) private var palette
    @State private var expanded = false

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() }
            } label: {
                HStack(spacing: 14) {
                    Image(systemName: icon).font(.system(size: 18)).foregroundStyle(iconColor)
                        .frame(width: 40, height: 40).background(iconBg).clipShape(.rect(cornerRadius: 12))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.text)
                        Text(subtitle).font(.system(size: 12)).foregroundStyle(palette.textMuted)
                    }
                    Spacer()
                    Image(systemName: expanded ? "chevron.down" : "chevron.right").font(.system(size: 14)).foregroundStyle(palette.textMuted)
                }
                .padding(16)
            }
            .buttonStyle(.plain)
            if expanded {
                content
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

/// Reel submission form embedded in the profile section.
struct ReelSubmitForm: View {
    @Environment(\.palette) private var palette
    @Environment(ReelsStore.self) private var reelsStore
    @Environment(AppStore.self) private var store
    @State private var title = ""
    @State private var tourTitle = ""
    @State private var city = ""
    @State private var submitted = false

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "bitcoinsign.circle.fill").foregroundStyle(palette.teal)
                Text("За добавление reels начисляется \(reelsStore.rewardPoints) баллов. Видео появится в ленте после модерации.")
                    .font(.system(size: 12)).foregroundStyle(palette.teal)
            }
            .padding(12).background(palette.tealSoft).clipShape(.rect(cornerRadius: 12))

            field("Название reels", $title)
            field("Название экскурсии", $tourTitle)
            field("Город", $city)

            Button {
                let reward = reelsStore.submitReel(title: title, tourTitle: tourTitle, city: city)
                store.points += reward
                title = ""; tourTitle = ""; city = ""; submitted = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "video.fill")
                    Text("Отправить на модерацию").font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 12)
                .background(palette.coral).clipShape(.rect(cornerRadius: 12))
            }

            ForEach(reelsStore.moderationReels) { reel in
                HStack(spacing: 10) {
                    RemoteImage(url: reel.coverImage, height: 44).frame(width: 44).clipShape(.rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(reel.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                        Text("На модерации администратора").font(.system(size: 12)).foregroundStyle(palette.orange)
                    }
                    Spacer()
                }
                .padding(12).background(palette.surfaceSecondary).clipShape(.rect(cornerRadius: 12))
            }
        }
        .alert("Reels отправлен", isPresented: $submitted) {
            Button("Ок", role: .cancel) {}
        } message: {
            Text("Видео отправлено администратору на модерацию. Баллы начислены.")
        }
    }

    private func field(_ placeholder: String, _ text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .font(.system(size: 14))
            .padding(12)
            .background(palette.surfaceSecondary)
            .clipShape(.rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
    }
}

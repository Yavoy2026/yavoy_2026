//
//  TourDetailView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct TourDetailView: View {
    let tourId: String
    let tourIds: [String]
    @Environment(\.palette) private var palette
    @State private var currentId: String

    init(tourId: String, tourIds: [String]) {
        self.tourId = tourId
        self.tourIds = tourIds.isEmpty ? [tourId] : tourIds
        _currentId = State(initialValue: tourId)
    }

    private var pages: [Tour] {
        tourIds.compactMap { id in MockData.tours.first { $0.id == id } }
    }

    var body: some View {
        TabView(selection: $currentId) {
            ForEach(pages) { tour in
                TourDetailPage(tour: tour)
                    .tag(tour.id)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .ignoresSafeArea(edges: .top)
        .background(palette.background)
        .overlay(alignment: .topTrailing) {
            if pages.count > 1 {
                Text("\(pageIndex + 1) / \(pages.count)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14).padding(.vertical, 7)
                    .background(.black.opacity(0.45))
                    .clipShape(.rect(cornerRadius: 16))
                    .padding(.trailing, 16)
                    .padding(.top, 8)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private var pageIndex: Int { pages.firstIndex { $0.id == currentId } ?? 0 }
}

private struct TourDetailPage: View {
    let tour: Tour
    @Environment(\.palette) private var palette
    @Environment(AppStore.self) private var store
    @State private var galleryIndex: Int = 0
    @State private var showBooking = false

    private var liked: Bool { store.isFavorite(tour.id) }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    gallery
                    content
                }
            }
            stickyBar
        }
        .background(palette.background)
        .sheet(isPresented: $showBooking) {
            BookingSheet(tour: tour)
        }
    }

    private var gallery: some View {
        TabView(selection: $galleryIndex) {
            ForEach(Array(tour.allImages.enumerated()), id: \.offset) { idx, img in
                RemoteImage(url: img, height: 320).tag(idx)
            }
        }
        .frame(height: 320)
        .tabViewStyle(.page)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                if tour.isBestseller {
                    badge("Хит продаж", icon: "flame.fill", bg: palette.coral)
                }
                if tour.isLikelyToSellOut {
                    Text("🔥 Раскупают быстро")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(palette.orange)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(palette.orange.opacity(0.12))
                        .clipShape(.rect(cornerRadius: 10))
                }
            }

            Text(tour.title).font(.system(size: 24, weight: .heavy)).foregroundStyle(palette.text)

            HStack(spacing: 14) {
                metaItem("mappin.circle.fill", MockData.cityName(tour.city))
                metaItem(tour.transport.systemImage, tour.transport.fullLabel)
                metaItem("clock.fill", tour.durationText)
            }

            Text(tour.interest.fullLabel)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(palette.teal)
                .padding(.horizontal, 12).padding(.vertical, 5)
                .background(palette.tealSoft)
                .clipShape(.rect(cornerRadius: 8))

            HStack(spacing: 8) {
                if tour.isInstantConfirmation { feature("bolt.fill", "Мгновенное подтверждение", palette.teal, palette.tealSoft) }
                if tour.isFreeCancellation { feature("arrow.uturn.backward", "Бесплатная отмена", palette.green, palette.green.opacity(0.12)) }
            }

            Text(tour.description).font(.system(size: 15)).foregroundStyle(palette.textSecondary).lineSpacing(4)

            if !tour.highlights.isEmpty {
                sectionBlock("Основные моменты") {
                    ForEach(tour.highlights, id: \.self) { h in
                        HStack(alignment: .top, spacing: 8) {
                            Circle().fill(palette.teal).frame(width: 6, height: 6).padding(.top, 7)
                            Text(h).font(.system(size: 14)).foregroundStyle(palette.textSecondary)
                        }
                    }
                }
            }

            if !tour.whatToBring.isEmpty {
                infoCardBlock(icon: "backpack.fill", title: "Что взять с собой", color: palette.orange) {
                    ForEach(tour.whatToBring, id: \.self) { item in
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark").font(.system(size: 12)).foregroundStyle(palette.teal)
                            Text(item).font(.system(size: 14)).foregroundStyle(palette.textSecondary)
                        }
                    }
                }
            }

            includesBlock

            infoGrid

            policiesBlock

            organizerCard

            if !tour.reviews.isEmpty {
                sectionBlock("Отзывы") {
                    ForEach(tour.reviews) { review in reviewCard(review) }
                }
            }

            actionRow
        }
        .padding(20)
        .background(palette.background)
        .clipShape(.rect(topLeadingRadius: 24, topTrailingRadius: 24))
        .offset(y: -20)
        .padding(.bottom, 80)
    }

    private var includesBlock: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Включено").font(.system(size: 15, weight: .bold)).foregroundStyle(palette.text)
                ForEach(tour.includes, id: \.self) { item in
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark").font(.system(size: 12)).foregroundStyle(palette.green)
                        Text(item).font(.system(size: 13)).foregroundStyle(palette.textSecondary)
                    }
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Не включено").font(.system(size: 15, weight: .bold)).foregroundStyle(palette.text)
                ForEach(tour.excludes, id: \.self) { item in
                    HStack(spacing: 6) {
                        Image(systemName: "xmark").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                        Text(item).font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 16))
    }

    private var infoGrid: some View {
        VStack(spacing: 10) {
            if let start = tour.startTime { infoRow("clock.fill", "НАЧАЛО ТУРА", start) }
            infoRow("calendar", "РАСПИСАНИЕ", tour.schedule)
            infoRow("person.2.fill", "ГРУППА", tour.groupSize)
            infoRow("globe", "ЯЗЫКИ", tour.languages.joined(separator: ", "))
            if let mp = tour.meetingPoint {
                Link(destination: URL(string: "https://yandex.ru/maps/?text=\(mp.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!) {
                    infoRow("location.north.circle.fill", "МЕСТО ВСТРЕЧИ", mp, accent: true)
                }
            }
        }
    }

    private var policiesBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            if tour.bookingConditions != nil || tour.prepayment != nil || tour.cancellationPolicy != nil {
                Text("Условия и политика").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            }
            if let bc = tour.bookingConditions { policyItem("doc.text.fill", "Условия бронирования", bc, palette.teal) }
            if let pp = tour.prepayment { policyItem("creditcard.fill", "Предоплата", pp, palette.orange) }
            if let cp = tour.cancellationPolicy { policyItem("nosign", "Условия отмены", cp, palette.red) }
        }
    }

    private var organizerCard: some View {
        HStack(spacing: 12) {
            RemoteImage(url: tour.organizer.avatar, height: 52).frame(width: 52).clipShape(Circle())
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 4) {
                    Text("Организатор").font(.system(size: 11)).foregroundStyle(palette.textMuted)
                    if tour.organizer.verified {
                        Image(systemName: "checkmark.seal.fill").font(.system(size: 11)).foregroundStyle(palette.teal)
                    }
                }
                Text(tour.organizer.name).font(.system(size: 16, weight: .bold)).foregroundStyle(palette.text)
                StarRatingView(rating: tour.organizer.rating, reviewCount: tour.organizer.reviewCount)
                Text("\(tour.organizer.toursCount) экскурсий на платформе").font(.system(size: 12)).foregroundStyle(palette.textMuted)
            }
            Spacer()
        }
        .padding(16)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 16))
    }

    private var actionRow: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) { store.toggleFavorite(tour.id) }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: liked ? "heart.fill" : "heart").foregroundStyle(palette.coral)
                    Text(liked ? "В избранном" : "В избранное").font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(liked ? palette.coral : palette.textSecondary)
                }
                .frame(maxWidth: .infinity).padding(.vertical, 13)
                .background(liked ? palette.coral.opacity(0.12) : palette.surface)
                .clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
            }
            .buttonStyle(.plain)

            ShareLink(item: shareText) {
                HStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.up").foregroundStyle(palette.teal)
                    Text("Поделиться").font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.textSecondary)
                }
                .frame(maxWidth: .infinity).padding(.vertical, 13)
                .background(palette.surface)
                .clipShape(.rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
            }
        }
    }

    private var shareText: String {
        "🏷 \(tour.title)\n📍 \(MockData.cityName(tour.city))\n💰 \(tour.price.formatted()) \(tour.currency)\n\(tour.description)\n\nYAVOY Travel Group"
    }

    private var stickyBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                if tour.hasDiscount, let original = tour.originalPrice {
                    Text("\(original.formatted())₽").font(.system(size: 13)).strikethrough().foregroundStyle(palette.textMuted)
                }
                Text("\(tour.price.formatted()) \(tour.currency)").font(.system(size: 20, weight: .heavy)).foregroundStyle(palette.text)
                Text("за человека").font(.system(size: 11)).foregroundStyle(palette.textMuted)
            }
            Spacer()
            Button { showBooking = true } label: {
                Text("Забронировать")
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 28).padding(.vertical, 15)
                    .background(palette.teal)
                    .clipShape(.rect(cornerRadius: 14))
            }
        }
        .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 24)
        .background(palette.surface)
        .overlay(alignment: .top) { Rectangle().fill(palette.border).frame(height: 1) }
    }

    // MARK: helpers

    private func badge(_ text: String, icon: String, bg: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10, weight: .bold))
            Text(text).font(.system(size: 12, weight: .bold))
        }
        .foregroundStyle(.white).padding(.horizontal, 10).padding(.vertical, 5).background(bg).clipShape(.rect(cornerRadius: 10))
    }

    private func metaItem(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(palette.teal)
            Text(text).font(.system(size: 13, weight: .medium)).foregroundStyle(palette.textSecondary)
        }
    }

    private func feature(_ icon: String, _ text: String, _ color: Color, _ bg: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 13))
            Text(text).font(.system(size: 12, weight: .semibold))
        }
        .foregroundStyle(color).padding(.horizontal, 12).padding(.vertical, 7).background(bg).clipShape(.rect(cornerRadius: 10))
    }

    @ViewBuilder private func sectionBlock<C: View>(_ title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            content()
        }
    }

    @ViewBuilder private func infoCardBlock<C: View>(icon: String, title: String, color: Color, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color)
                    .frame(width: 32, height: 32).background(color.opacity(0.12)).clipShape(.rect(cornerRadius: 8))
                Text(title).font(.system(size: 16, weight: .bold)).foregroundStyle(palette.text)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16).background(palette.surface).clipShape(.rect(cornerRadius: 16))
    }

    private func infoRow(_ icon: String, _ label: String, _ value: String, accent: Bool = false) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(palette.teal)
                .frame(width: 36, height: 36).background(palette.tealSoft).clipShape(.rect(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 11, weight: .semibold)).foregroundStyle(palette.textMuted)
                Text(value).font(.system(size: 14, weight: .medium)).foregroundStyle(accent ? palette.teal : palette.text)
            }
            Spacer()
        }
        .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
    }

    private func policyItem(_ icon: String, _ title: String, _ text: String, _ color: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color)
                .frame(width: 32, height: 32).background(color.opacity(0.12)).clipShape(.rect(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                Text(text).font(.system(size: 13)).foregroundStyle(palette.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
    }

    private func reviewCard(_ review: TourReview) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                RemoteImage(url: review.avatar, height: 40).frame(width: 40).clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(review.author).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                    Text(review.date).font(.system(size: 12)).foregroundStyle(palette.textMuted)
                }
                Spacer()
                HStack(spacing: 3) {
                    Image(systemName: "star.fill").font(.system(size: 12)).foregroundStyle(palette.gold)
                    Text("\(review.rating)").font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.teal)
                }
                .padding(.horizontal, 8).padding(.vertical, 4).background(palette.tealSoft).clipShape(.rect(cornerRadius: 8))
            }
            Text(review.text).font(.system(size: 14)).foregroundStyle(palette.textSecondary)
        }
        .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
    }
}

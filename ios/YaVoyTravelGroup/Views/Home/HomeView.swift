//
//  HomeView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct HomeView: View {
    @Environment(\.palette) private var palette
    @Environment(ReelsStore.self) private var reelsStore

    @State private var selectedCity: String?
    @State private var selectedDuration: DurationType?
    @State private var selectedTransport: TransportType?
    @State private var selectedInterest: InterestType?
    @State private var selectedSort: SortType = .popularity
    @State private var searchQuery: String = ""

    private var hasActiveFilters: Bool {
        selectedCity != nil || selectedDuration != nil || selectedTransport != nil || selectedInterest != nil || !searchQuery.isEmpty
    }

    private var filteredTours: [Tour] {
        var result = MockData.tours
        if let c = selectedCity { result = result.filter { $0.city == c } }
        if let d = selectedDuration { result = result.filter { $0.duration == d } }
        if let t = selectedTransport { result = result.filter { $0.transport == t } }
        if let i = selectedInterest { result = result.filter { $0.interest == i } }
        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter {
                $0.title.lowercased().contains(q) ||
                $0.description.lowercased().contains(q) ||
                MockData.cityName($0.city).lowercased().contains(q)
            }
        }
        switch selectedSort {
        case .popularity: result.sort { $0.popularity > $1.popularity }
        case .newest: result.sort { $0.nextAvailableDate < $1.nextAvailableDate }
        case .priceAsc: result.sort { $0.price < $1.price }
        case .priceDesc: result.sort { $0.price > $1.price }
        }
        return result
    }

    private var popularTours: [Tour] {
        MockData.tours.filter { $0.popularity >= 85 }.sorted { $0.popularity > $1.popularity }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 16, pinnedViews: []) {
                    searchBar
                    citySection
                    if !hasActiveFilters {
                        reelsRow
                        popularCarousel
                    }
                    filterRow
                    sortRow
                    feedHeader
                    ForEach(filteredTours) { tour in
                        NavigationLink(value: TourRoute(tourId: tour.id, ids: filteredTours.map(\.id))) {
                            TourCardView(tour: tour)
                                .padding(.horizontal, 16)
                        }
                        .buttonStyle(.plain)
                    }
                    if filteredTours.isEmpty {
                        emptyState
                    }
                    AdvantagesBlock()
                }
                .padding(.vertical, 12)
            }
            .background(palette.background)
            .navigationTitle("Экскурсии")
            .navigationDestination(for: TourRoute.self) { route in
                TourDetailView(tourId: route.tourId, tourIds: route.ids)
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(palette.textMuted)
            TextField("Поиск экскурсий, городов...", text: $searchQuery)
                .font(.system(size: 15))
                .foregroundStyle(palette.text)
            if !searchQuery.isEmpty {
                Button { searchQuery = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(palette.textMuted)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 14))
        .overlay { RoundedRectangle(cornerRadius: 14).stroke(palette.border, lineWidth: 1) }
        .padding(.horizontal, 16)
    }

    private var citySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Куда поедем?")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(palette.text)
                .padding(.horizontal, 16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(MockData.cities) { city in
                        Button {
                            withAnimation { selectedCity = selectedCity == city.id ? nil : city.id }
                        } label: {
                            cityChip(city)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .contentMargins(.horizontal, 16, for: .scrollContent)
        }
    }

    private func cityChip(_ city: City) -> some View {
        let active = selectedCity == city.id
        return VStack(spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                RemoteImage(url: city.image, height: 90)
                    .frame(width: 130)
                LinearGradient(colors: [.clear, .black.opacity(0.5)], startPoint: .top, endPoint: .bottom)
                    .frame(width: 130, height: 90)
                    .allowsHitTesting(false)
                HStack(spacing: 4) {
                    Text(city.emoji)
                    Text(city.name).font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                }
                .padding(8)
            }
            .frame(width: 130, height: 90)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14)
                    .stroke(active ? palette.teal : .clear, lineWidth: 3)
            }
        }
    }

    private var reelsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Истории путешествий").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
                Spacer()
                NavigationLink(value: ReelsRoute()) {
                    Text("Все").font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.teal)
                }
            }
            .padding(.horizontal, 16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(reelsStore.publishedReels) { reel in
                        NavigationLink(value: ReelsRoute(startId: reel.id)) {
                            reelThumb(reel)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .contentMargins(.horizontal, 16, for: .scrollContent)
        }
        .navigationDestination(for: ReelsRoute.self) { route in
            ReelsView(startId: route.startId)
        }
    }

    private func reelThumb(_ reel: TravelReel) -> some View {
        ZStack(alignment: .bottomLeading) {
            RemoteImage(url: reel.coverImage, height: 180).frame(width: 120)
            LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)
                .frame(width: 120, height: 180)
                .allowsHitTesting(false)
            VStack(alignment: .leading, spacing: 2) {
                Text(reel.title).font(.system(size: 12, weight: .bold)).foregroundStyle(.white).lineLimit(2)
                HStack(spacing: 3) {
                    Image(systemName: "play.fill").font(.system(size: 8))
                    Text(reel.views).font(.system(size: 10))
                }.foregroundStyle(.white.opacity(0.85))
            }
            .padding(8)
        }
        .frame(width: 120, height: 180)
        .clipShape(.rect(cornerRadius: 14))
    }

    private var popularCarousel: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Популярные экскурсии").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
                .padding(.horizontal, 16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(popularTours) { tour in
                        NavigationLink(value: TourRoute(tourId: tour.id, ids: popularTours.map(\.id))) {
                            TourCardView(tour: tour, compact: true).frame(width: 280)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .contentMargins(.horizontal, 16, for: .scrollContent)
        }
    }

    private var filterRow: some View {
        VStack(spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Menu {
                        Button("Все") { selectedDuration = nil }
                        ForEach(DurationType.allCases) { d in
                            Button(d.label) { selectedDuration = d }
                        }
                    } label: { ChipView(label: selectedDuration?.label ?? "Дни", systemImage: "calendar", isActive: selectedDuration != nil) }

                    Menu {
                        Button("Все") { selectedTransport = nil }
                        ForEach(TransportType.allCases) { t in
                            Button(t.label) { selectedTransport = t }
                        }
                    } label: { ChipView(label: selectedTransport?.label ?? "Транспорт", systemImage: "car.fill", isActive: selectedTransport != nil) }

                    Menu {
                        Button("Все") { selectedInterest = nil }
                        ForEach(InterestType.allCases) { i in
                            Button(i.label) { selectedInterest = i }
                        }
                    } label: { ChipView(label: selectedInterest?.label ?? "Интересы", systemImage: "sparkles", isActive: selectedInterest != nil) }
                }
            }
            .contentMargins(.horizontal, 16, for: .scrollContent)
        }
    }

    private var sortRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.up.arrow.down").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                ForEach(SortType.allCases) { opt in
                    Button { selectedSort = opt } label: {
                        ChipView(label: opt.label, isActive: selectedSort == opt)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .contentMargins(.horizontal, 16, for: .scrollContent)
    }

    private var feedHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(selectedCity.map { MockData.cityName($0) } ?? "Все направления")
                    .font(.system(size: 20, weight: .heavy)).foregroundStyle(palette.text)
                Text("\(filteredTours.count) \(tourCountText(filteredTours.count))")
                    .font(.system(size: 13)).foregroundStyle(palette.textMuted)
            }
            Spacer()
            if hasActiveFilters {
                Button {
                    withAnimation {
                        selectedCity = nil; selectedDuration = nil; selectedTransport = nil
                        selectedInterest = nil; searchQuery = ""
                    }
                } label: {
                    Text("Сбросить").font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.teal)
                }
            }
        }
        .padding(.horizontal, 16)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("🧭").font(.system(size: 48))
            Text("Экскурсии не найдены").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            Text("Попробуйте изменить фильтры или выбрать другой город")
                .font(.system(size: 14)).foregroundStyle(palette.textMuted).multilineTextAlignment(.center)
        }
        .padding(40)
    }

    private func tourCountText(_ count: Int) -> String {
        let lastTwo = count % 100, lastOne = count % 10
        if lastTwo >= 11 && lastTwo <= 19 { return "экскурсий" }
        if lastOne == 1 { return "экскурсия" }
        if lastOne >= 2 && lastOne <= 4 { return "экскурсии" }
        return "экскурсий"
    }
}

struct TourRoute: Hashable {
    let tourId: String
    let ids: [String]
}

struct ReelsRoute: Hashable {
    var startId: String? = nil
}

struct AdvantagesBlock: View {
    @Environment(\.palette) private var palette
    private let items: [(String, String, String)] = [
        ("checkmark.shield.fill", "Проверенные гиды", "Рейтинговая система и модерация"),
        ("bolt.fill", "Мгновенное бронирование", "Подтверждение за секунды"),
        ("arrow.uturn.backward", "Бесплатная отмена", "На большинство экскурсий"),
        ("headphones", "Поддержка 24/7", "Всегда на связи"),
    ]
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Почему YaVoy").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            ForEach(items, id: \.0) { item in
                HStack(spacing: 12) {
                    Image(systemName: item.0)
                        .font(.system(size: 18))
                        .foregroundStyle(palette.teal)
                        .frame(width: 44, height: 44)
                        .background(palette.tealSoft)
                        .clipShape(.rect(cornerRadius: 12))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.1).font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.text)
                        Text(item.2).font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    }
                    Spacer()
                }
            }
        }
        .padding(18)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 18))
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }
}

//
//  ExploreView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct ExploreView: View {
    @Environment(\.palette) private var palette

    private var topRated: [Tour] {
        MockData.tours.sorted { $0.organizer.rating > $1.organizer.rating }.prefix(5).map { $0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    citiesSection
                    topRatedSection
                }
                .padding(.vertical, 16)
            }
            .background(palette.background)
            .navigationTitle("Направления")
            .navigationDestination(for: TourRoute.self) { route in
                TourDetailView(tourId: route.tourId, tourIds: route.ids)
            }
            .navigationDestination(for: CityRoute.self) { route in
                CityToursView(cityId: route.cityId)
            }
        }
    }

    private var citiesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "mappin.circle.fill").foregroundStyle(palette.teal)
                Text("Популярные города").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            }
            .padding(.horizontal, 16)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(MockData.cities) { city in
                    NavigationLink(value: CityRoute(cityId: city.id)) {
                        cityCard(city)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func cityCard(_ city: City) -> some View {
        ZStack(alignment: .bottomLeading) {
            RemoteImage(url: city.image, height: 140)
            LinearGradient(colors: [.clear, .black.opacity(0.45)], startPoint: .center, endPoint: .bottom)
                .frame(height: 140).allowsHitTesting(false)
            VStack(alignment: .leading, spacing: 2) {
                Text(city.emoji).font(.system(size: 20))
                Text(city.name).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                Text("\(city.tourCount) туров")
                    .font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(.white.opacity(0.2)).clipShape(.rect(cornerRadius: 8))
            }
            .padding(10)
        }
        .frame(height: 140)
        .clipShape(.rect(cornerRadius: 16))
    }

    private var topRatedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "chart.line.uptrend.xyaxis").foregroundStyle(palette.gold)
                Text("Лучшие по рейтингу").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
            }
            ForEach(Array(topRated.enumerated()), id: \.element.id) { index, tour in
                NavigationLink(value: TourRoute(tourId: tour.id, ids: [tour.id])) {
                    HStack(spacing: 10) {
                        Text("\(index + 1)")
                            .font(.system(size: 12, weight: .heavy)).foregroundStyle(palette.teal)
                            .frame(width: 24, height: 24).background(palette.tealSoft).clipShape(Circle())
                        RemoteImage(url: tour.image, height: 48).frame(width: 48).clipShape(.rect(cornerRadius: 10))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(tour.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(palette.gold)
                                Text(String(format: "%.1f", tour.organizer.rating)).font(.system(size: 12, weight: .semibold)).foregroundStyle(palette.text)
                                Text("(\(tour.organizer.reviewCount))").font(.system(size: 11)).foregroundStyle(palette.textMuted)
                            }
                            Text("от \(tour.price.formatted())\(tour.currency)").font(.system(size: 13, weight: .bold)).foregroundStyle(palette.teal)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    }
                    .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
                Divider().background(palette.border)
            }
        }
        .padding(16)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 18))
        .padding(.horizontal, 16)
    }
}

struct CityRoute: Hashable { let cityId: String }

struct CityToursView: View {
    let cityId: String
    @Environment(\.palette) private var palette

    private var cityTours: [Tour] { MockData.tours.filter { $0.city == cityId } }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(cityTours) { tour in
                    NavigationLink(value: TourRoute(tourId: tour.id, ids: cityTours.map(\.id))) {
                        TourCardView(tour: tour).padding(.horizontal, 16)
                    }
                    .buttonStyle(.plain)
                }
                if cityTours.isEmpty {
                    Text("Скоро здесь появятся экскурсии")
                        .font(.system(size: 14)).foregroundStyle(palette.textMuted).padding(40)
                }
            }
            .padding(.vertical, 12)
        }
        .background(palette.background)
        .navigationTitle(MockData.cityName(cityId))
        .navigationBarTitleDisplayMode(.inline)
    }
}

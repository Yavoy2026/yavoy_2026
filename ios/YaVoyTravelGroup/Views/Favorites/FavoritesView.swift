//
//  FavoritesView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct FavoritesView: View {
    @Environment(\.palette) private var palette
    @Environment(AppStore.self) private var store
    @State private var tab: Tab = .tours

    enum Tab { case tours, cities }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack(spacing: 10) {
                    tabButton("Экскурсии", count: store.favoriteTours.count, icon: "heart.fill", isActive: tab == .tours) { tab = .tours }
                    tabButton("Города", count: store.favoriteCities.count, icon: "mappin.circle.fill", isActive: tab == .cities) { tab = .cities }
                    Spacer()
                }
                .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 8)

                if tab == .tours {
                    toursList
                } else {
                    citiesList
                }
            }
            .background(palette.background)
            .navigationTitle("Избранное")
            .navigationDestination(for: TourRoute.self) { route in
                TourDetailView(tourId: route.tourId, tourIds: route.ids)
            }
        }
    }

    @ViewBuilder private var toursList: some View {
        if store.favoriteTours.isEmpty {
            emptyState(icon: "heart", title: "Нет избранных экскурсий", text: "Нажмите на сердечко на карточке, чтобы добавить экскурсию в избранное")
        } else {
            ScrollView {
                LazyVStack(spacing: 14) {
                    ForEach(store.favoriteTours) { tour in
                        NavigationLink(value: TourRoute(tourId: tour.id, ids: store.favoriteTours.map(\.id))) {
                            TourCardView(tour: tour, compact: true).padding(.horizontal, 16)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 8)
            }
        }
    }

    @ViewBuilder private var citiesList: some View {
        if store.favoriteCities.isEmpty {
            emptyState(icon: "mappin.circle", title: "Нет избранных городов", text: "Отметьте города как избранные, чтобы они появились здесь")
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(store.favoriteCities) { city in
                        cityCard(city)
                    }
                }
                .padding(.vertical, 8)
            }
        }
    }

    private func cityCard(_ city: City) -> some View {
        VStack(spacing: 0) {
            RemoteImage(url: city.image, height: 140)
            HStack {
                Text(city.emoji).font(.system(size: 28))
                VStack(alignment: .leading, spacing: 2) {
                    Text(city.name).font(.system(size: 16, weight: .bold)).foregroundStyle(palette.text)
                    Text(city.description).font(.system(size: 12)).foregroundStyle(palette.textSecondary).lineLimit(1)
                }
                Spacer()
                Button {
                    withAnimation { store.toggleFavoriteCity(city.id) }
                } label: {
                    Image(systemName: "heart.fill").font(.system(size: 16)).foregroundStyle(palette.coral)
                        .frame(width: 32, height: 32).background(palette.surfaceSecondary).clipShape(Circle())
                }
            }
            .padding(14)
        }
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 10, y: 3)
        .padding(.horizontal, 16)
    }

    private func tabButton(_ label: String, count: Int, icon: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 13))
                Text(count > 0 ? "\(label) (\(count))" : label).font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(isActive ? .white : palette.textMuted)
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(isActive ? palette.teal : palette.surfaceSecondary)
            .clipShape(.rect(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private func emptyState(icon: String, title: String, text: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: icon).font(.system(size: 40)).foregroundStyle(palette.textMuted)
                .frame(width: 80, height: 80).background(palette.surfaceSecondary).clipShape(Circle())
            Text(title).font(.system(size: 20, weight: .bold)).foregroundStyle(palette.text)
            Text(text).font(.system(size: 14)).foregroundStyle(palette.textMuted).multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

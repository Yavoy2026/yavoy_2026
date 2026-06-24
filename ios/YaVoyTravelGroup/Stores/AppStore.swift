//
//  AppStore.swift
//  YaVoyTravelGroup
//

import SwiftUI
import Observation

/// Global store for theme, favorites, bookings and loyalty.
@MainActor
@Observable
final class AppStore {
    var themeMode: AppThemeMode = .dark {
        didSet { persist() }
    }
    var favoriteTourIds: Set<String> = [] {
        didSet { persist() }
    }
    var favoriteCityIds: Set<String> = [] {
        didSet { persist() }
    }
    var bookings: [BookedTour] = []
    var points: Int = 4250

    private let defaults = UserDefaults.standard

    init() {
        if let raw = defaults.string(forKey: "themeMode"), let mode = AppThemeMode(rawValue: raw) {
            themeMode = mode
        }
        favoriteTourIds = Set(defaults.stringArray(forKey: "favTours") ?? [])
        favoriteCityIds = Set(defaults.stringArray(forKey: "favCities") ?? [])
    }

    private func persist() {
        defaults.set(themeMode.rawValue, forKey: "themeMode")
        defaults.set(Array(favoriteTourIds), forKey: "favTours")
        defaults.set(Array(favoriteCityIds), forKey: "favCities")
    }

    func palette(for scheme: ColorScheme) -> ThemePalette {
        switch themeMode {
        case .system: return scheme == .dark ? .dark : .light
        case .light: return .light
        case .dark: return .dark
        }
    }

    var preferredColorScheme: ColorScheme? {
        switch themeMode {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    func isFavorite(_ id: String) -> Bool { favoriteTourIds.contains(id) }

    func toggleFavorite(_ id: String) {
        if favoriteTourIds.contains(id) {
            favoriteTourIds.remove(id)
        } else {
            favoriteTourIds.insert(id)
        }
    }

    func isFavoriteCity(_ id: String) -> Bool { favoriteCityIds.contains(id) }

    func toggleFavoriteCity(_ id: String) {
        if favoriteCityIds.contains(id) {
            favoriteCityIds.remove(id)
        } else {
            favoriteCityIds.insert(id)
        }
    }

    func addBooking(_ booking: BookedTour) {
        bookings.insert(booking, at: 0)
        points += booking.totalPrice / 100
    }

    var favoriteTours: [Tour] {
        MockData.tours.filter { favoriteTourIds.contains($0.id) }
    }

    var favoriteCities: [City] {
        MockData.cities.filter { favoriteCityIds.contains($0.id) }
    }
}

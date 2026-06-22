//
//  RootView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var systemScheme

    var body: some View {
        let palette = store.palette(for: systemScheme)
        TabView {
            HomeView()
                .tabItem { Label("Экскурсии", systemImage: "safari.fill") }
            ExploreView()
                .tabItem { Label("Направления", systemImage: "map.fill") }
            FavoritesView()
                .tabItem { Label("Избранное", systemImage: "heart.fill") }
            ProfileView()
                .tabItem { Label("Профиль", systemImage: "person.fill") }
        }
        .tint(palette.teal)
        .environment(\.palette, palette)
        .preferredColorScheme(store.preferredColorScheme)
    }
}

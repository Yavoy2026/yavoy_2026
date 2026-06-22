//
//  YaVoyTravelGroupApp.swift
//  YaVoyTravelGroup
//

import SwiftUI

@main
struct YaVoyTravelGroupApp: App {
    @State private var appStore = AppStore()
    @State private var reelsStore = ReelsStore()
    @State private var partnersStore = PartnersStore()
    @State private var adminStore = AdminStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appStore)
                .environment(reelsStore)
                .environment(partnersStore)
                .environment(adminStore)
        }
    }
}

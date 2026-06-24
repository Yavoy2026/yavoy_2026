//
//  AppTheme.swift
//  YaVoyTravelGroup
//

import SwiftUI

/// Theme palette mirroring the React Native YaVoy design tokens.
struct ThemePalette {
    let navy: Color
    let navyLight: Color
    let teal: Color
    let tealLight: Color
    let tealSoft: Color
    let gold: Color
    let coral: Color
    let mint: Color
    let green: Color
    let orange: Color
    let red: Color
    let background: Color
    let surface: Color
    let surfaceSecondary: Color
    let text: Color
    let textSecondary: Color
    let textMuted: Color
    let border: Color
    let headerBg: Color

    static let light = ThemePalette(
        navy: Color(hex: "1B2838"),
        navyLight: Color(hex: "243447"),
        teal: Color(hex: "0FA3B1"),
        tealLight: Color(hex: "14C4D4"),
        tealSoft: Color(hex: "0FA3B1").opacity(0.08),
        gold: Color(hex: "E8B931"),
        coral: Color(hex: "FF6B6B"),
        mint: Color(hex: "2ED8A3"),
        green: Color(hex: "27AE60"),
        orange: Color(hex: "F39C12"),
        red: Color(hex: "E74C3C"),
        background: Color(hex: "F5F7FA"),
        surface: Color(hex: "FFFFFF"),
        surfaceSecondary: Color(hex: "FAFBFC"),
        text: Color(hex: "1B2838"),
        textSecondary: Color(hex: "5F6B7A"),
        textMuted: Color(hex: "8892A0"),
        border: Color(hex: "EEF1F5"),
        headerBg: Color(hex: "1B2838")
    )

    static let dark = ThemePalette(
        navy: Color(hex: "E8EDF2"),
        navyLight: Color(hex: "1E2A3A"),
        teal: Color(hex: "14C4D4"),
        tealLight: Color(hex: "1AD8E9"),
        tealSoft: Color(hex: "14C4D4").opacity(0.12),
        gold: Color(hex: "F0CE5E"),
        coral: Color(hex: "FF8585"),
        mint: Color(hex: "3EEDB8"),
        green: Color(hex: "3EEDB8"),
        orange: Color(hex: "FFB347"),
        red: Color(hex: "FF6B6B"),
        background: Color(hex: "0D1520"),
        surface: Color(hex: "151F2E"),
        surfaceSecondary: Color(hex: "1A2738"),
        text: Color(hex: "E8EDF2"),
        textSecondary: Color(hex: "94A3B5"),
        textMuted: Color(hex: "6B7D92"),
        border: Color(hex: "1A2738"),
        headerBg: Color(hex: "0D1520")
    )
}

enum AppThemeMode: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }
    var label: String {
        switch self {
        case .system: return "Системная"
        case .light: return "Светлая"
        case .dark: return "Тёмная"
        }
    }
}

/// Resolves the active palette based on the chosen mode and the system color scheme.
struct ThemeKey: EnvironmentKey {
    static let defaultValue: ThemePalette = .dark
}

extension EnvironmentValues {
    var palette: ThemePalette {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

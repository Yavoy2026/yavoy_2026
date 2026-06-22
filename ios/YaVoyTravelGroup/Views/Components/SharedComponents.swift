//
//  SharedComponents.swift
//  YaVoyTravelGroup
//

import SwiftUI

/// Remote image with a colored placeholder anchor (avoids .fill layout overflow).
struct RemoteImage: View {
    let url: String
    var height: CGFloat? = nil
    var cornerRadius: CGFloat = 0
    @Environment(\.palette) private var palette

    var body: some View {
        Rectangle()
            .fill(palette.surfaceSecondary)
            .modifier(OptionalHeight(height: height))
            .overlay {
                AsyncImage(url: URL(string: url)) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: .fill)
                    case .empty:
                        ProgressView().tint(palette.teal)
                    case .failure:
                        Image(systemName: "photo")
                            .font(.title2)
                            .foregroundStyle(palette.textMuted)
                    @unknown default:
                        EmptyView()
                    }
                }
                .allowsHitTesting(false)
            }
            .clipShape(.rect(cornerRadius: cornerRadius))
    }
}

private struct OptionalHeight: ViewModifier {
    let height: CGFloat?
    func body(content: Content) -> some View {
        if let height {
            content.frame(height: height)
        } else {
            content
        }
    }
}

/// Gold star rating row with review count.
struct StarRatingView: View {
    let rating: Double
    var reviewCount: Int? = nil
    var size: CGFloat = 13
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<5, id: \.self) { i in
                Image(systemName: starName(for: i))
                    .font(.system(size: size))
                    .foregroundStyle(palette.gold)
            }
            Text(String(format: "%.1f", rating))
                .font(.system(size: size, weight: .semibold))
                .foregroundStyle(palette.text)
            if let reviewCount {
                Text("(\(reviewCount))")
                    .font(.system(size: size - 1))
                    .foregroundStyle(palette.textMuted)
            }
        }
    }

    private func starName(for index: Int) -> String {
        let value = rating - Double(index)
        if value >= 1 { return "star.fill" }
        if value >= 0.5 { return "star.leadinghalf.filled" }
        return "star"
    }
}

/// Pill chip used by filters and tags.
struct ChipView: View {
    let label: String
    var systemImage: String? = nil
    let isActive: Bool
    @Environment(\.palette) private var palette

    var body: some View {
        HStack(spacing: 5) {
            if let systemImage {
                Image(systemName: systemImage).font(.system(size: 12, weight: .semibold))
            }
            Text(label).font(.system(size: 13, weight: .semibold))
        }
        .foregroundStyle(isActive ? .white : palette.textSecondary)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(isActive ? palette.teal : palette.surface)
        .clipShape(.rect(cornerRadius: 11))
        .overlay {
            RoundedRectangle(cornerRadius: 11)
                .stroke(isActive ? palette.teal : palette.border, lineWidth: 1)
        }
    }
}

/// Status badge used across partner/admin lists.
struct StatusBadge: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(color.opacity(0.14))
            .clipShape(.rect(cornerRadius: 8))
    }
}

struct SectionCard<Content: View>: View {
    @Environment(\.palette) private var palette
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(16)
            .background(palette.surface)
            .clipShape(.rect(cornerRadius: 16))
    }
}

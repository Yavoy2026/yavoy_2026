//
//  TourCardView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct TourCardView: View {
    let tour: Tour
    var compact: Bool = false
    @Environment(\.palette) private var palette
    @Environment(AppStore.self) private var store

    private var liked: Bool { store.isFavorite(tour.id) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                RemoteImage(url: tour.image, height: compact ? 150 : 200)
                LinearGradient(
                    colors: [.clear, .black.opacity(0.35)],
                    startPoint: .center, endPoint: .bottom
                )
                .frame(height: compact ? 150 : 200)
                .allowsHitTesting(false)

                // top badges
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        if tour.isBestseller {
                            badge("Хит продаж", icon: "flame.fill", bg: palette.coral)
                        }
                        if tour.hasDiscount {
                            badge("-\(tour.discountPercent)%", icon: nil, bg: palette.green)
                        }
                    }
                    Spacer()
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                            store.toggleFavorite(tour.id)
                        }
                    } label: {
                        Image(systemName: liked ? "heart.fill" : "heart")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(liked ? palette.coral : .white)
                            .frame(width: 38, height: 38)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                }
                .padding(12)

                // city pill bottom-left
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill").font(.system(size: 11))
                    Text(MockData.cityName(tour.city)).font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(.ultraThinMaterial)
                .clipShape(.rect(cornerRadius: 9))
                .padding(12)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(tour.title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(palette.text)
                    .lineLimit(2)

                if !compact {
                    Text(tour.description)
                        .font(.system(size: 13))
                        .foregroundStyle(palette.textSecondary)
                        .lineLimit(2)
                }

                HStack(spacing: 12) {
                    metaItem(icon: tour.transport.systemImage, text: tour.transport.fullLabel)
                    metaItem(icon: "clock.fill", text: tour.durationText)
                }

                HStack(spacing: 6) {
                    Image(systemName: "star.fill").font(.system(size: 12)).foregroundStyle(palette.gold)
                    Text(String(format: "%.1f", tour.organizer.rating))
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.text)
                    Text("· \(tour.organizer.reviewCount) отзывов")
                        .font(.system(size: 12)).foregroundStyle(palette.textMuted)
                    if tour.organizer.verified {
                        Image(systemName: "checkmark.seal.fill").font(.system(size: 12)).foregroundStyle(palette.teal)
                    }
                }

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    if tour.hasDiscount, let original = tour.originalPrice {
                        Text("\(original.formatted())\(tour.currency)")
                            .font(.system(size: 13))
                            .strikethrough()
                            .foregroundStyle(palette.textMuted)
                    }
                    Text("\(tour.price.formatted()) \(tour.currency)")
                        .font(.system(size: 19, weight: .heavy))
                        .foregroundStyle(palette.teal)
                    Text("/ чел.").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                }
            }
            .padding(14)
        }
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 18))
        .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
    }

    private func badge(_ text: String, icon: String?, bg: Color) -> some View {
        HStack(spacing: 4) {
            if let icon { Image(systemName: icon).font(.system(size: 10, weight: .bold)) }
            Text(text).font(.system(size: 11, weight: .bold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(bg)
        .clipShape(.rect(cornerRadius: 9))
    }

    private func metaItem(icon: String, text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 12)).foregroundStyle(palette.teal)
            Text(text).font(.system(size: 12, weight: .medium)).foregroundStyle(palette.textSecondary)
        }
    }
}

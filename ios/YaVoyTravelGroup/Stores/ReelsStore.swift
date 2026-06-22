//
//  ReelsStore.swift
//  YaVoyTravelGroup
//

import SwiftUI
import Observation

@MainActor
@Observable
final class ReelsStore {
    var reels: [TravelReel] = MockData.reels
    let rewardPoints: Int = 500

    var publishedReels: [TravelReel] { reels.filter { $0.status == .published } }
    var moderationReels: [TravelReel] { reels.filter { $0.status == .moderation } }

    func toggleLike(_ id: String) {
        guard let idx = reels.firstIndex(where: { $0.id == id }) else { return }
        reels[idx].likedByMe.toggle()
    }

    @discardableResult
    func submitReel(title: String, tourTitle: String, city: String) -> Int {
        let reel = TravelReel(
            id: "rl-\(Int(Date().timeIntervalSince1970))",
            title: title.isEmpty ? "Новый Reels" : title,
            city: city,
            tourTitle: tourTitle,
            coverImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=900&fit=crop",
            author: "Иван Петров",
            duration: "0:30",
            views: "0",
            likes: "0",
            likedByMe: false,
            story: "",
            status: .moderation
        )
        reels.append(reel)
        return rewardPoints
    }

    func approveReel(_ id: String) {
        guard let idx = reels.firstIndex(where: { $0.id == id }) else { return }
        reels[idx].status = .published
    }

    func rejectReel(_ id: String) {
        guard let idx = reels.firstIndex(where: { $0.id == id }) else { return }
        reels[idx].status = .rejected
    }
}

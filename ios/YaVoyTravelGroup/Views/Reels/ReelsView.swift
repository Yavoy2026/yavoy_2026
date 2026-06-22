//
//  ReelsView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct ReelsView: View {
    var startId: String?
    @Environment(\.palette) private var palette
    @Environment(ReelsStore.self) private var reelsStore
    @Environment(\.dismiss) private var dismiss
    @State private var currentId: String = ""

    private var reels: [TravelReel] { reelsStore.publishedReels }

    var body: some View {
        TabView(selection: $currentId) {
            ForEach(reels) { reel in
                ReelPage(reel: reel).tag(reel.id)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .rotationEffect(.degrees(90))
        .frame(width: UIScreen.main.bounds.height, height: UIScreen.main.bounds.width)
        .rotationEffect(.degrees(-90))
        .frame(width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height)
        .ignoresSafeArea()
        .background(.black)
        .overlay(alignment: .topLeading) {
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 42, height: 42).background(.black.opacity(0.4)).clipShape(Circle())
            }
            .padding(.leading, 16).padding(.top, 8)
        }
        .navigationBarBackButtonHidden()
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            currentId = startId ?? reels.first?.id ?? ""
        }
    }
}

private struct ReelPage: View {
    let reel: TravelReel
    @Environment(\.palette) private var palette
    @Environment(ReelsStore.self) private var reelsStore

    var body: some View {
        ZStack {
            RemoteImage(url: reel.coverImage)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            LinearGradient(colors: [.black.opacity(0.2), .clear, .black.opacity(0.7)], startPoint: .top, endPoint: .bottom)
                .allowsHitTesting(false)

            VStack {
                Spacer()
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("@\(reel.author)").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                        Text(reel.title).font(.system(size: 20, weight: .heavy)).foregroundStyle(.white)
                        HStack(spacing: 6) {
                            Image(systemName: "mappin.circle.fill").font(.system(size: 12))
                            Text(MockData.cityName(reel.city)).font(.system(size: 13, weight: .semibold))
                        }.foregroundStyle(.white.opacity(0.9))
                        Text(reel.story).font(.system(size: 14)).foregroundStyle(.white.opacity(0.85)).lineLimit(3)
                        Text("Экскурсия: \(reel.tourTitle)")
                            .font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(.white.opacity(0.2)).clipShape(.rect(cornerRadius: 10))
                    }
                    Spacer()
                    VStack(spacing: 20) {
                        Button {
                            reelsStore.toggleLike(reel.id)
                        } label: {
                            VStack(spacing: 4) {
                                Image(systemName: reel.likedByMe ? "heart.fill" : "heart")
                                    .font(.system(size: 30)).foregroundStyle(reel.likedByMe ? palette.coral : .white)
                                Text(reel.likes).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                            }
                        }
                        VStack(spacing: 4) {
                            Image(systemName: "eye.fill").font(.system(size: 26)).foregroundStyle(.white)
                            Text(reel.views).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                        }
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.black)
    }
}

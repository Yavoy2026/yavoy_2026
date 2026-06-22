//
//  PartnerCabinetView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct PartnerCabinetView: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @State private var tab: PartnerTab = .tours
    @State private var period: StatPeriod = .month
    @State private var showAddForm = false
    @State private var chatTourId: String?

    enum PartnerTab: String, CaseIterable, Identifiable {
        case tours, guests, transactions, reviews, chat
        var id: String { rawValue }
        var label: String {
            switch self {
            case .tours: return "Туры"
            case .guests: return "Клиенты"
            case .transactions: return "Транзакции"
            case .reviews: return "Отзывы"
            case .chat: return "Чат"
            }
        }
    }

    enum StatPeriod: String, CaseIterable, Identifiable {
        case week, month, halfYear, year, all
        var id: String { rawValue }
        var label: String {
            switch self {
            case .week: return "Неделя"
            case .month: return "Месяц"
            case .halfYear: return "Полгода"
            case .year: return "Год"
            case .all: return "Всё время"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ratingCard
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(PartnerTab.allCases) { t in
                            Button { tab = t } label: {
                                ChipView(label: t.label, isActive: tab == t)
                            }.buttonStyle(.plain)
                        }
                    }
                }
                .contentMargins(.horizontal, 0, for: .scrollContent)

                switch tab {
                case .tours: toursTab
                case .guests: guestsTab
                case .transactions: transactionsTab
                case .reviews: reviewsTab
                case .chat: chatTab
                }
            }
            .padding(20)
        }
        .sheet(isPresented: $showAddForm) { AddTourForm() }
        .sheet(item: Binding(get: { chatTourId.map { IdWrapper(id: $0) } }, set: { chatTourId = $0?.id })) { wrapper in
            PartnerChatSheet(tourId: wrapper.id)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { partners.logout() } label: { Image(systemName: "rectangle.portrait.and.arrow.right") }
            }
        }
    }

    private var ratingCard: some View {
        let rating = partners.partnerRating
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Рейтинг партнёра").font(.system(size: 13)).foregroundStyle(palette.textMuted)
                HStack(spacing: 6) {
                    Text(String(format: "%.1f", rating.average)).font(.system(size: 28, weight: .heavy)).foregroundStyle(palette.text)
                    StarRatingView(rating: rating.average, size: 14)
                }
                Text("\(rating.count) отзывов").font(.system(size: 12)).foregroundStyle(palette.textMuted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                StatusBadge(text: "\(partners.stats.published) опубл.", color: palette.green)
                StatusBadge(text: "\(partners.stats.pending) на модер.", color: palette.orange)
            }
        }
        .padding(16).background(palette.surface).clipShape(.rect(cornerRadius: 16))
    }

    private var toursTab: some View {
        VStack(spacing: 12) {
            Button { showAddForm = true } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus")
                    Text("Добавить экскурсию").font(.system(size: 15, weight: .semibold))
                }
                .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 13)
                .background(palette.teal).clipShape(.rect(cornerRadius: 12))
            }
            ForEach(partners.tours) { tour in
                HStack(spacing: 10) {
                    RemoteImage(url: tour.image, height: 54).frame(width: 54).clipShape(.rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 4) {
                        Text(tour.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(2)
                        HStack(spacing: 8) {
                            Text("\(tour.price.formatted())\(tour.currency)").font(.system(size: 13, weight: .bold)).foregroundStyle(palette.teal)
                            StatusBadge(text: tour.status.label, color: statusColor(tour.status))
                        }
                    }
                    Spacer()
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var guestsTab: some View {
        VStack(spacing: 10) {
            ForEach(partners.guests) { g in
                HStack(spacing: 12) {
                    Image(systemName: "person.circle.fill").font(.system(size: 34)).foregroundStyle(palette.teal)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(g.firstName) \(g.lastName)").font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                        Text(g.phone).font(.system(size: 12)).foregroundStyle(palette.textMuted)
                        Text("\(g.tourDate) · \(g.ticketCount) билетов").font(.system(size: 12)).foregroundStyle(palette.textSecondary)
                    }
                    Spacer()
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var transactionsTab: some View {
        VStack(spacing: 12) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(StatPeriod.allCases) { p in
                        Button { period = p } label: { ChipView(label: p.label, isActive: period == p) }.buttonStyle(.plain)
                    }
                }
            }
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Итого за период").font(.system(size: 13)).foregroundStyle(palette.textMuted)
                    Text("\(periodSum.formatted()) ₽").font(.system(size: 26, weight: .heavy)).foregroundStyle(palette.teal)
                }
                Spacer()
                Image(systemName: "wallet.bifold.fill").font(.system(size: 32)).foregroundStyle(palette.teal.opacity(0.5))
            }
            .padding(16).background(palette.tealSoft).clipShape(.rect(cornerRadius: 16))

            ForEach(partners.transactions) { tr in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(tr.tourTitle).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                        Text("\(tr.guestName) · \(tr.date)").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(tr.amount.formatted())\(tr.currency)").font(.system(size: 14, weight: .bold)).foregroundStyle(palette.text)
                        StatusBadge(text: tr.status == "completed" ? "Оплачено" : "В обработке", color: tr.status == "completed" ? palette.green : palette.orange)
                    }
                }
                .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            }
        }
    }

    private var periodSum: Int {
        switch period {
        case .week: return partners.stats.week
        case .month: return partners.stats.month
        case .halfYear: return partners.stats.halfYear
        case .year: return partners.stats.year
        case .all: return partners.stats.all
        }
    }

    private var reviewsTab: some View {
        VStack(spacing: 12) {
            ForEach(partners.ownerReviews) { review in
                PartnerReviewCard(review: review)
            }
        }
    }

    private var chatTab: some View {
        VStack(spacing: 10) {
            Text("Чаты с клиентами по вашим турам. Администратор автоматически подключается к диалогу.")
                .font(.system(size: 13)).foregroundStyle(palette.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            ForEach(partners.tours) { tour in
                Button { chatTourId = tour.id } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "bubble.left.and.bubble.right.fill").foregroundStyle(palette.teal)
                            .frame(width: 40, height: 40).background(palette.tealSoft).clipShape(.rect(cornerRadius: 10))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(tour.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text).lineLimit(1)
                            Text("\(partners.chat(for: tour.id).count) сообщений").font(.system(size: 12)).foregroundStyle(palette.textMuted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(palette.textMuted)
                    }
                    .padding(12).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func statusColor(_ s: SubmissionStatus) -> Color {
        switch s {
        case .published: return palette.green
        case .pending: return palette.orange
        case .rejected: return palette.red
        }
    }
}

struct IdWrapper: Identifiable { let id: String }

struct PartnerReviewCard: View {
    let review: PartnerReview
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @State private var replyDraft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(review.author).font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
                Spacer()
                HStack(spacing: 3) {
                    Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(palette.gold)
                    Text("\(review.rating)").font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.text)
                }
            }
            Text(review.text).font(.system(size: 14)).foregroundStyle(palette.textSecondary)

            if let reply = review.reply {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrowshape.turn.up.left.fill").font(.system(size: 11)).foregroundStyle(palette.teal)
                        Text("Ваш ответ").font(.system(size: 12, weight: .semibold)).foregroundStyle(palette.teal)
                        StatusBadge(text: replyStatusLabel(reply.status), color: replyStatusColor(reply.status))
                    }
                    Text(reply.content).font(.system(size: 13)).foregroundStyle(palette.textSecondary)
                }
                .padding(12).background(palette.surfaceSecondary).clipShape(.rect(cornerRadius: 10))
            } else {
                HStack(spacing: 8) {
                    TextField("Ответить на отзыв...", text: $replyDraft)
                        .font(.system(size: 13)).padding(10).background(palette.surfaceSecondary).clipShape(.rect(cornerRadius: 10))
                    Button {
                        partners.submitReviewReply(reviewId: review.id, content: replyDraft)
                        replyDraft = ""
                    } label: {
                        Image(systemName: "paperplane.fill").foregroundStyle(.white)
                            .frame(width: 40, height: 40).background(palette.teal).clipShape(.rect(cornerRadius: 10))
                    }
                }
            }
        }
        .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 14))
    }

    private func replyStatusLabel(_ s: ReplyStatus) -> String {
        switch s {
        case .pending: return "На модерации"
        case .approved: return "Опубликован"
        case .rejected: return "Отклонён"
        }
    }
    private func replyStatusColor(_ s: ReplyStatus) -> Color {
        switch s {
        case .pending: return palette.orange
        case .approved: return palette.green
        case .rejected: return palette.red
        }
    }
}

struct PartnerChatSheet: View {
    let tourId: String
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @Environment(\.dismiss) private var dismiss
    @State private var input = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(partners.chat(for: tourId)) { msg in
                            chatBubble(msg)
                        }
                    }
                    .padding(16)
                }
                HStack(spacing: 8) {
                    TextField("Сообщение...", text: $input)
                        .padding(12).background(palette.surfaceSecondary).clipShape(.rect(cornerRadius: 12))
                    Button {
                        partners.sendChatMessage(tourId: tourId, content: input); input = ""
                    } label: {
                        Image(systemName: "paperplane.fill").foregroundStyle(.white)
                            .frame(width: 44, height: 44).background(palette.teal).clipShape(Circle())
                    }
                }
                .padding(12)
            }
            .background(palette.background)
            .navigationTitle("Чат по туру")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Закрыть") { dismiss() } } }
        }
    }

    private func chatBubble(_ msg: PartnerChatMessage) -> some View {
        let isPartner = msg.authorType == "partner"
        let isAdmin = msg.authorType == "admin"
        return HStack {
            if isPartner { Spacer() }
            VStack(alignment: .leading, spacing: 3) {
                Text(msg.authorName).font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(isAdmin ? palette.gold : (isPartner ? .white.opacity(0.8) : palette.textMuted))
                Text(msg.content).font(.system(size: 14))
                    .foregroundStyle(isPartner ? .white : palette.text)
                Text(msg.createdAt).font(.system(size: 10))
                    .foregroundStyle(isPartner ? .white.opacity(0.6) : palette.textMuted)
            }
            .padding(12)
            .background(isPartner ? palette.teal : (isAdmin ? palette.gold.opacity(0.15) : palette.surface))
            .clipShape(.rect(cornerRadius: 14))
            .frame(maxWidth: 280, alignment: isPartner ? .trailing : .leading)
            if !isPartner { Spacer() }
        }
    }
}

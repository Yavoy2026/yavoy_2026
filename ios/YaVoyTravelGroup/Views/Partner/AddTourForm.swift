//
//  AddTourForm.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct AddTourForm: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var desc = ""
    @State private var city = ""
    @State private var price = ""
    @State private var groupSize = ""
    @State private var meeting = ""
    @State private var duration: DurationType = .oneDay
    @State private var transport: TransportType = .auto
    @State private var interest: InterestType = .city
    @State private var submitted = false

    private var canSubmit: Bool {
        !title.isEmpty && !desc.isEmpty && !city.isEmpty && Int(price) != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    field("Название экскурсии", $title)
                    multilineField("Описание", $desc)
                    field("Город", $city)
                    field("Цена, ₽", $price, keyboard: .numberPad)
                    field("Размер группы", $groupSize)
                    field("Место сбора", $meeting)

                    pickerBlock("Длительность") {
                        Picker("", selection: $duration) {
                            ForEach(DurationType.allCases) { Text($0.label).tag($0) }
                        }.pickerStyle(.segmented)
                    }
                    pickerBlock("Транспорт") {
                        Picker("", selection: $transport) {
                            ForEach(TransportType.allCases) { Text($0.label).tag($0) }
                        }.pickerStyle(.menu).tint(palette.teal)
                    }
                    pickerBlock("Интерес") {
                        Picker("", selection: $interest) {
                            ForEach(InterestType.allCases) { Text($0.label).tag($0) }
                        }.pickerStyle(.menu).tint(palette.teal)
                    }

                    contentBlock

                    Button(action: submit) {
                        Text("Отправить на модерацию").font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(canSubmit ? palette.teal : palette.textMuted).clipShape(.rect(cornerRadius: 14))
                    }
                    .disabled(!canSubmit)
                }
                .padding(20)
            }
            .background(palette.background)
            .navigationTitle("Новая экскурсия")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Отмена") { dismiss() } } }
            .alert("Отправлено", isPresented: $submitted) {
                Button("Ок") { dismiss() }
            } message: {
                Text("Экскурсия отправлена администратору на модерацию.")
            }
        }
    }

    private var contentBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Фото и видео экскурсии").font(.system(size: 14, weight: .semibold)).foregroundStyle(palette.text)
            HStack(spacing: 10) {
                contentButton("Добавить фото", icon: "photo.on.rectangle")
                contentButton("Добавить видео", icon: "video.badge.plus")
            }
            Text("Первое фото станет обложкой экскурсии.").font(.system(size: 12)).foregroundStyle(palette.textMuted)
        }
    }

    private func contentButton(_ label: String, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 22)).foregroundStyle(palette.teal)
            Text(label).font(.system(size: 12, weight: .medium)).foregroundStyle(palette.textSecondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 18)
        .background(palette.surfaceSecondary).clipShape(.rect(cornerRadius: 12))
        .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, style: StrokeStyle(lineWidth: 1, dash: [5])) }
    }

    private func field(_ placeholder: String, _ text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .font(.system(size: 15)).padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
    }

    private func multilineField(_ placeholder: String, _ text: Binding<String>) -> some View {
        TextField(placeholder, text: text, axis: .vertical)
            .lineLimit(3...6)
            .font(.system(size: 15)).padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
    }

    private func pickerBlock<C: View>(_ label: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.textSecondary)
            content()
        }
    }

    private func submit() {
        guard let priceInt = Int(price) else { return }
        let tour = PartnerTourSubmission(
            id: "psub-\(Int(Date().timeIntervalSince1970))",
            title: title, description: desc, city: city, price: priceInt, currency: "₽",
            image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop",
            duration: duration, transport: transport, interest: interest,
            groupSize: groupSize.isEmpty ? "до 15 человек" : groupSize,
            meetingPoint: meeting, status: .pending,
            submittedAt: "", partnerInn: ""
        )
        partners.submitTour(tour)
        submitted = true
    }
}

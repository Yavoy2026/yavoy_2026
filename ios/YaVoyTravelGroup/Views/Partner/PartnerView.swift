//
//  PartnerView.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct PartnerView: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners

    var body: some View {
        Group {
            if !partners.isRegistered {
                PartnerRegistrationView()
            } else if partners.profile?.approvalStatus == .contactsRequired {
                PartnerContactsView()
            } else if partners.profile?.approvalStatus == .pendingApproval {
                PartnerStatusView(approved: false)
            } else if partners.profile?.approvalStatus == .rejected {
                PartnerStatusView(approved: false, rejected: true)
            } else {
                PartnerCabinetView()
            }
        }
        .background(palette.background)
        .navigationTitle("Партнёрам")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Registration

private struct PartnerRegistrationView: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @State private var inn = ""
    @State private var error: String?
    @State private var acceptedTerms = false
    @State private var acceptedPrivacy = false
    @State private var acceptedOffer = false
    @State private var openDoc: LegalDocKey?

    private var canSubmit: Bool { acceptedTerms && acceptedPrivacy && acceptedOffer && !inn.isEmpty }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                hero
                Text("Регистрация партнёра").font(.system(size: 20, weight: .bold)).foregroundStyle(palette.text)
                Text(partners.registrationText).font(.system(size: 14)).foregroundStyle(palette.textSecondary)

                TextField("ИНН или ОГРН", text: $inn)
                    .keyboardType(.numberPad)
                    .font(.system(size: 16, weight: .semibold))
                    .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
                    .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }

                if let error {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.circle.fill")
                        Text(error).font(.system(size: 13))
                    }.foregroundStyle(palette.red)
                }

                consent("Принимаю пользовательское соглашение", $acceptedTerms, .terms)
                consent("Согласие на обработку персональных данных", $acceptedPrivacy, .privacy)
                consent("Согласен с договором-офертой", $acceptedOffer, .offer)

                Button(action: verify) {
                    HStack {
                        if partners.verifying { ProgressView().tint(.white) }
                        Text(partners.verifying ? "Проверка в ФНС..." : "Проверить")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 15)
                    .background(canSubmit ? palette.teal : palette.textMuted)
                    .clipShape(.rect(cornerRadius: 14))
                }
                .disabled(!canSubmit || partners.verifying)
            }
            .padding(20)
        }
        .sheet(item: Binding(get: { openDoc.map { DocWrapper(key: $0) } }, set: { openDoc = $0?.key })) { wrapper in
            LegalDocSheet(docKey: wrapper.key)
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: "briefcase.fill").font(.system(size: 32)).foregroundStyle(.white)
            Text("Станьте партнёром YaVoy").font(.system(size: 22, weight: .heavy)).foregroundStyle(.white)
            Text("Размещайте свои экскурсии, принимайте бронирования и получайте выплаты раз в неделю.")
                .font(.system(size: 14)).foregroundStyle(.white.opacity(0.85))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(LinearGradient(colors: [palette.navy, palette.teal], startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(.rect(cornerRadius: 18))
    }

    private func consent(_ text: String, _ binding: Binding<Bool>, _ doc: LegalDocKey) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Button { binding.wrappedValue.toggle() } label: {
                Image(systemName: binding.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 22)).foregroundStyle(binding.wrappedValue ? palette.teal : palette.textMuted)
            }
            Button { openDoc = doc } label: {
                Text(text).font(.system(size: 13)).underline().foregroundStyle(palette.textSecondary)
                    .multilineTextAlignment(.leading)
            }
            Spacer()
        }
    }

    private func verify() {
        error = nil
        Task {
            if let err = await partners.verifyAndRegister(inn) {
                error = err
            }
        }
    }
}

struct DocWrapper: Identifiable { let key: LegalDocKey; var id: String { key.rawValue } }

struct LegalDocSheet: View {
    let docKey: LegalDocKey
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if let doc = partners.legalDocs[docKey] {
                        Text(doc.body).font(.system(size: 14)).foregroundStyle(palette.textSecondary).lineSpacing(4)
                    }
                }
                .padding(20)
            }
            .background(palette.background)
            .navigationTitle(partners.legalDocs[docKey]?.title ?? "Документ")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Закрыть") { dismiss() } }
            }
        }
    }
}

// MARK: - Contacts

private struct PartnerContactsView: View {
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners
    @State private var email = ""
    @State private var phone = ""
    @State private var telegram = ""
    @State private var countryCode = "+7"

    private let codes = ["+7", "+375", "+1", "+44", "+49", "+90", "+86"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let p = partners.profile {
                    fnsCard(p)
                }
                Text("Контактные данные").font(.system(size: 18, weight: .bold)).foregroundStyle(palette.text)
                Text("Заполните контакты — после проверки администратор подтвердит ваш аккаунт.")
                    .font(.system(size: 13)).foregroundStyle(palette.textSecondary)

                labeledField("Email", icon: "envelope.fill") {
                    TextField("email@example.com", text: $email)
                        .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                labeledField("Телефон", icon: "phone.fill") {
                    HStack(spacing: 8) {
                        Menu {
                            ForEach(codes, id: \.self) { c in Button(c) { countryCode = c } }
                        } label: {
                            Text(countryCode).font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.teal)
                        }
                        TextField("Номер телефона", text: $phone).keyboardType(.phonePad)
                    }
                }
                labeledField("Telegram", icon: "paperplane.fill") {
                    TextField("@username", text: $telegram).autocorrectionDisabled().textInputAutocapitalization(.never)
                }

                Button {
                    partners.submitContacts(email: email, phone: "\(countryCode) \(phone)", telegram: telegram)
                } label: {
                    Text("Отправить на подтверждение").font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 15)
                        .background(canSubmit ? palette.teal : palette.textMuted).clipShape(.rect(cornerRadius: 14))
                }
                .disabled(!canSubmit)
            }
            .padding(20)
        }
    }

    private var canSubmit: Bool {
        email.contains("@") && !phone.isEmpty && !telegram.isEmpty
    }

    private func fnsCard(_ p: PartnerProfile) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.seal.fill").foregroundStyle(palette.green)
                Text("Проверено в ФНС").font(.system(size: 13, weight: .bold)).foregroundStyle(palette.green)
            }
            infoLine("Тип", p.entityType.label)
            infoLine("Наименование", p.legalName)
            if let ceo = p.ceo { infoLine("Руководитель", ceo) }
            infoLine("ИНН", p.inn)
            infoLine("Адрес", p.address)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16).background(palette.surface).clipShape(.rect(cornerRadius: 16))
    }

    private func infoLine(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label).font(.system(size: 13)).foregroundStyle(palette.textMuted).frame(width: 110, alignment: .leading)
            Text(value).font(.system(size: 13, weight: .medium)).foregroundStyle(palette.text)
            Spacer()
        }
    }

    private func labeledField<C: View>(_ label: String, icon: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.system(size: 13, weight: .semibold)).foregroundStyle(palette.textSecondary)
            HStack(spacing: 10) {
                Image(systemName: icon).foregroundStyle(palette.textMuted)
                content().foregroundStyle(palette.text)
            }
            .padding(14).background(palette.surface).clipShape(.rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
        }
    }
}

// MARK: - Status

private struct PartnerStatusView: View {
    let approved: Bool
    var rejected: Bool = false
    @Environment(\.palette) private var palette
    @Environment(PartnersStore.self) private var partners

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: rejected ? "xmark.circle.fill" : "clock.badge.checkmark.fill")
                .font(.system(size: 56)).foregroundStyle(rejected ? palette.red : palette.orange)
            Text(rejected ? "Заявка отклонена" : "Аккаунт на проверке")
                .font(.system(size: 22, weight: .bold)).foregroundStyle(palette.text)
            Text(rejected
                 ? "К сожалению, ваша заявка отклонена администратором. Свяжитесь с поддержкой."
                 : "Данные проверены в ФНС. Администратор подтвердит ваш аккаунт в ближайшее время.")
                .font(.system(size: 14)).foregroundStyle(palette.textSecondary).multilineTextAlignment(.center)
            Button("Выйти") { partners.logout() }
                .font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.teal)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

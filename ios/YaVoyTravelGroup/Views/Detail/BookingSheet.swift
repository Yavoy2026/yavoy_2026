//
//  BookingSheet.swift
//  YaVoyTravelGroup
//

import SwiftUI

struct BookingSheet: View {
    let tour: Tour
    @Environment(\.palette) private var palette
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var authMode: AuthMode = .phone
    @State private var phone: String = ""
    @State private var email: String = ""
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var confirmed = false

    enum AuthMode { case phone, email }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(tour.title).font(.system(size: 15)).foregroundStyle(palette.textSecondary)

                    Picker("Способ", selection: $authMode) {
                        Text("Телефон").tag(AuthMode.phone)
                        Text("Email").tag(AuthMode.email)
                    }
                    .pickerStyle(.segmented)

                    if authMode == .phone {
                        field(icon: "phone.fill", placeholder: "+7 (___) ___-__-__", text: $phone, keyboard: .phonePad)
                    } else {
                        field(icon: "envelope.fill", placeholder: "email@example.com", text: $email, keyboard: .emailAddress)
                    }
                    field(icon: "person.fill", placeholder: "Имя", text: $firstName)
                    field(icon: "person.fill", placeholder: "Фамилия", text: $lastName)

                    Button(action: book) {
                        Text("Забронировать")
                            .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(palette.teal).clipShape(.rect(cornerRadius: 14))
                    }
                    .padding(.top, 4)
                }
                .padding(20)
            }
            .background(palette.background)
            .navigationTitle("Бронирование")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                }
            }
            .alert("Бронирование", isPresented: $confirmed) {
                Button("Отлично") { dismiss() }
            } message: {
                Text("Заявка на «\(tour.title)» отправлена! Тур добавлен в ваши поездки.")
            }
        }
    }

    private func field(icon: String, placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(palette.textMuted)
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .autocorrectionDisabled()
                .textInputAutocapitalization(keyboard == .emailAddress ? .never : .words)
                .foregroundStyle(palette.text)
        }
        .padding(14)
        .background(palette.surface)
        .clipShape(.rect(cornerRadius: 12))
        .overlay { RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1) }
    }

    private func book() {
        let contact = authMode == .phone ? phone : email
        guard !contact.trimmingCharacters(in: .whitespaces).isEmpty,
              !firstName.trimmingCharacters(in: .whitespaces).isEmpty,
              !lastName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let booking = BookedTour(
            id: "bk-\(Int(Date().timeIntervalSince1970))",
            tourId: tour.id, tourTitle: tour.title, tourImage: tour.image,
            tourDate: tour.nextAvailableDate, tourStartTime: tour.startTime ?? "10:00",
            ticketCount: 1, totalPrice: tour.price, currency: tour.currency,
            confirmationCode: "YV-\(String(Int(Date().timeIntervalSince1970), radix: 36).uppercased())",
            status: "upcoming", firstName: firstName, lastName: lastName, contact: contact,
            organizerName: tour.organizer.name
        )
        store.addBooking(booking)
        confirmed = true
    }
}

//
//  MockData.swift
//  YaVoyTravelGroup
//

import Foundation

enum MockData {
    static let cities: [City] = [
        City(id: "moscow", name: "Москва", image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&h=400&fit=crop", tourCount: 156, description: "Столица России с богатой историей", emoji: "🏛"),
        City(id: "spb", name: "Санкт-Петербург", image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=600&h=400&fit=crop", tourCount: 203, description: "Культурная столица и город белых ночей", emoji: "🌉"),
        City(id: "sochi", name: "Сочи", image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&h=400&fit=crop", tourCount: 89, description: "Курортная столица юга России", emoji: "🏖"),
        City(id: "kazan", name: "Казань", image: "https://images.unsplash.com/photo-1623846750638-2765f498d67f?w=600&h=400&fit=crop", tourCount: 67, description: "Город на стыке двух культур", emoji: "🕌"),
        City(id: "kaliningrad", name: "Калининград", image: "https://images.unsplash.com/photo-1600421777050-1fdf399a1284?w=600&h=400&fit=crop", tourCount: 42, description: "Самый европейский город России", emoji: "⚓"),
        City(id: "baikal", name: "Байкал", image: "https://images.unsplash.com/photo-1551845041-63e8e76836ea?w=600&h=400&fit=crop", tourCount: 31, description: "Жемчужина Сибири", emoji: "🏔"),
        City(id: "vladivostok", name: "Владивосток", image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&h=400&fit=crop", tourCount: 28, description: "Ворота в Тихий океан", emoji: "🌊"),
        City(id: "yekaterinburg", name: "Екатеринбург", image: "https://images.unsplash.com/photo-1571504211935-1c936b327411?w=600&h=400&fit=crop", tourCount: 35, description: "Столица Урала", emoji: "⛰"),
    ]

    static var cityNameMap: [String: String] {
        Dictionary(uniqueKeysWithValues: cities.map { ($0.id, $0.name) })
    }

    static func cityName(_ id: String) -> String { cityNameMap[id] ?? id }

    static let tours: [Tour] = [
        Tour(
            id: "1",
            title: "Обзорная экскурсия по Москве",
            description: "Погрузитесь в историю столицы! Вы увидите Кремль, Красную площадь, Храм Василия Блаженного, Большой театр и другие знаковые достопримечательности. Профессиональный гид расскажет увлекательные факты о каждом месте.",
            image: "https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=800&h=600&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop",
            ],
            price: 2500, originalPrice: 3200, currency: "₽",
            duration: .oneDay, durationText: "4 часа", transport: .auto, interest: .city, city: "moscow",
            organizer: TourOrganizer(id: "org1", name: "МосТур", rating: 4.8, reviewCount: 342, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", verified: true, toursCount: 28),
            highlights: ["Кремль и Красная площадь", "Храм Василия Блаженного", "Большой театр", "Смотровая площадка"],
            includes: ["Транспорт", "Профессиональный гид", "Входные билеты", "Аудиогид"],
            excludes: ["Питание", "Сувениры"],
            schedule: "Ежедневно в 10:00, 14:00", groupSize: "до 15 человек", languages: ["Русский", "English"],
            popularity: 95, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: true,
            reviews: [
                TourReview(id: "r1", author: "Анна М.", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", rating: 5, text: "Потрясающая экскурсия! Гид был невероятно интересным рассказчиком.", date: "2026-03-20"),
                TourReview(id: "r2", author: "Дмитрий К.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", rating: 5, text: "Рекомендую всем! Узнал много нового о Москве.", date: "2026-03-15"),
            ],
            meetingPoint: "Метро Охотный Ряд, выход 7", nextAvailableDate: "2026-04-08", startTime: "10:00",
            whatToBring: ["Удобная обувь", "Головной убор", "Бутылка воды", "Фотоаппарат"],
            bookingConditions: "Бронирование подтверждается мгновенно. Дети до 7 лет — бесплатно.",
            prepayment: "Предоплата 100% при бронировании. Оплата картой или СБП.",
            cancellationPolicy: "Бесплатная отмена за 24 часа до начала."
        ),
        Tour(
            id: "2",
            title: "Речная прогулка по Москве-реке",
            description: "Романтическая прогулка на теплоходе по центру Москвы. Вы увидите город с воды, насладитесь закатом и фотогеничными видами на набережные и мосты.",
            image: "https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=800&h=600&fit=crop"],
            price: 1800, originalPrice: nil, currency: "₽",
            duration: .oneDay, durationText: "2.5 часа", transport: .water, interest: .city, city: "moscow",
            organizer: TourOrganizer(id: "org2", name: "Речфлот Экскурсии", rating: 4.5, reviewCount: 189, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", verified: true, toursCount: 12),
            highlights: ["Вид на Кремль с воды", "Проход под историческими мостами", "Закатная прогулка"],
            includes: ["Билет на теплоход", "Аудиогид", "Чай/кофе"],
            excludes: ["Алкогольные напитки", "Ужин"],
            schedule: "Ежедневно в 17:00, 19:30", groupSize: "до 40 человек", languages: ["Русский"],
            popularity: 78, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r4", author: "Мария В.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", rating: 5, text: "Красиво и романтично! Обязательно вернёмся.", date: "2026-03-18")],
            meetingPoint: "Причал «Киевский вокзал»", nextAvailableDate: "2026-04-08", startTime: "17:00",
            whatToBring: ["Тёплая одежда", "Фотоаппарат"], bookingConditions: nil,
            prepayment: "Предоплата 50%.", cancellationPolicy: "Отмена за 12 часов."
        ),
        Tour(
            id: "3",
            title: "Белые ночи Петербурга",
            description: "Вечерняя экскурсия по Северной столице с разводными мостами. Невероятная атмосфера белых ночей, набережные Невы и подсветка дворцов.",
            image: "https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop"],
            price: 3200, originalPrice: 3800, currency: "₽",
            duration: .oneDay, durationText: "5 часов", transport: .auto, interest: .city, city: "spb",
            organizer: TourOrganizer(id: "org3", name: "Северная Звезда", rating: 4.9, reviewCount: 521, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", verified: true, toursCount: 41),
            highlights: ["Разводные мосты", "Дворцовая площадь", "Набережные Невы"],
            includes: ["Транспорт", "Гид", "Ночная программа"],
            excludes: ["Питание"],
            schedule: "Май–июль в 22:30", groupSize: "до 20 человек", languages: ["Русский", "English"],
            popularity: 92, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r5", author: "Елена С.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop", rating: 5, text: "Волшебная атмосфера! Мосты — невероятное зрелище.", date: "2026-02-18")],
            meetingPoint: "Дворцовая площадь", nextAvailableDate: "2026-05-20", startTime: "22:30",
            whatToBring: ["Тёплая куртка", "Зонт"], bookingConditions: "Зависит от погоды.",
            prepayment: "Предоплата 100%.", cancellationPolicy: "Бесплатная отмена за 48 часов."
        ),
        Tour(
            id: "4",
            title: "Горный маршрут Красная Поляна",
            description: "Восхождение по живописным горным тропам Красной Поляны. Канатные дороги, панорамные виды Кавказа и чистый горный воздух.",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=600&fit=crop"],
            price: 4500, originalPrice: nil, currency: "₽",
            duration: .oneDay, durationText: "6 часов", transport: .auto, interest: .nature, city: "sochi",
            organizer: TourOrganizer(id: "org4", name: "Кавказ Адвенчер", rating: 4.7, reviewCount: 276, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", verified: true, toursCount: 19),
            highlights: ["Канатные дороги", "Горные тропы", "Панорама Кавказа"],
            includes: ["Транспорт", "Гид", "Билеты на канатку"],
            excludes: ["Обед", "Снаряжение"],
            schedule: "Ежедневно в 09:00", groupSize: "до 12 человек", languages: ["Русский"],
            popularity: 85, isInstantConfirmation: true, isFreeCancellation: false, isBestseller: false, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r6", author: "Олег П.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop", rating: 4, text: "Отличный маршрут, но хотелось бы больше остановок для фото.", date: "2026-01-15")],
            meetingPoint: "Роза Хутор, главный вход", nextAvailableDate: "2026-04-12", startTime: "09:00",
            whatToBring: ["Трекинговая обувь", "Куртка", "Вода"], bookingConditions: "Хорошая физическая форма.",
            prepayment: "Предоплата 30%.", cancellationPolicy: "Возврат 50% за 24 часа."
        ),
        Tour(
            id: "5",
            title: "Казанский Кремль и Старо-Татарская слобода",
            description: "Прогулка по объекту ЮНЕСКО — Казанскому Кремлю, мечеть Кул-Шариф и колоритная Старо-Татарская слобода с национальной кухней.",
            image: "https://images.unsplash.com/photo-1623846750638-2765f498d67f?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1601053680983-7b1a9e2c9e8f?w=800&h=600&fit=crop"],
            price: 2200, originalPrice: 2600, currency: "₽",
            duration: .oneDay, durationText: "3.5 часа", transport: .auto, interest: .educational, city: "kazan",
            organizer: TourOrganizer(id: "org5", name: "Казань Тур", rating: 4.6, reviewCount: 198, avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop", verified: true, toursCount: 23),
            highlights: ["Кул-Шариф", "Башня Сююмбике", "Татарская кухня"],
            includes: ["Гид", "Входные билеты", "Дегустация"],
            excludes: ["Транспорт до места", "Сувениры"],
            schedule: "Ежедневно в 11:00", groupSize: "до 18 человек", languages: ["Русский", "Татарский"],
            popularity: 81, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r7", author: "Рустам Г.", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=80&h=80&fit=crop", rating: 5, text: "Очень душевно и информативно. Чак-чак — объедение!", date: "2026-02-28")],
            meetingPoint: "Кремль, главный вход", nextAvailableDate: "2026-04-10", startTime: "11:00",
            whatToBring: ["Удобная обувь"], bookingConditions: nil,
            prepayment: "Предоплата 100%.", cancellationPolicy: "Бесплатная отмена за 24 часа."
        ),
        Tour(
            id: "6",
            title: "Велотур по Куршской косе",
            description: "Многодневное велопутешествие по национальному парку Куршская коса — танцующий лес, дюны и побережье Балтики.",
            image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop"],
            price: 12500, originalPrice: nil, currency: "₽",
            duration: .multiDay, durationText: "2 дня", transport: .bike, interest: .nature, city: "kaliningrad",
            organizer: TourOrganizer(id: "org6", name: "Балтика Лайф", rating: 4.8, reviewCount: 134, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop", verified: true, toursCount: 9),
            highlights: ["Танцующий лес", "Высота Эфа", "Побережье Балтики"],
            includes: ["Велосипед", "Гид", "Ночёвка", "Завтрак"],
            excludes: ["Обеды", "Ужины"],
            schedule: "По выходным", groupSize: "до 10 человек", languages: ["Русский"],
            popularity: 76, isInstantConfirmation: false, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r8", author: "Ирина Л.", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop", rating: 5, text: "Идеально для активного отдыха. Природа потрясающая!", date: "2026-03-01")],
            meetingPoint: "Зеленоградск, прокат велосипедов", nextAvailableDate: "2026-05-15", startTime: "08:00",
            whatToBring: ["Спортивная одежда", "Солнцезащитный крем"], bookingConditions: "Умение кататься на велосипеде.",
            prepayment: "Предоплата 50%.", cancellationPolicy: "Возврат 70% за 72 часа."
        ),
        Tour(
            id: "7",
            title: "Байкал зимой: лёд и легенды",
            description: "Незабываемое путешествие по зимнему Байкалу — прозрачный лёд, ледяные гроты острова Ольхон и бурятские легенды.",
            image: "https://images.unsplash.com/photo-1551845041-63e8e76836ea?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1601814933824-fd0b574dd592?w=800&h=600&fit=crop"],
            price: 18900, originalPrice: 21000, currency: "₽",
            duration: .multiDay, durationText: "3 дня", transport: .auto, interest: .nature, city: "baikal",
            organizer: TourOrganizer(id: "org7", name: "Сибирь Экспедиция", rating: 4.9, reviewCount: 312, avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop", verified: true, toursCount: 15),
            highlights: ["Ледяные гроты Ольхона", "Прозрачный лёд", "Бурятская кухня"],
            includes: ["Трансфер", "Гид", "Проживание", "Питание"],
            excludes: ["Авиабилеты", "Личные расходы"],
            schedule: "Январь–март", groupSize: "до 8 человек", languages: ["Русский", "English"],
            popularity: 88, isInstantConfirmation: false, isFreeCancellation: false, isBestseller: true, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r9", author: "Павел Д.", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop", rating: 5, text: "Лучшее зимнее путешествие в моей жизни. Лёд — нечто космическое!", date: "2026-02-10")],
            meetingPoint: "Аэропорт Иркутска", nextAvailableDate: "2026-12-20", startTime: "07:00",
            whatToBring: ["Тёплая зимняя одежда", "Термос", "Ледоступы"], bookingConditions: "Бронирование за 14 дней.",
            prepayment: "Предоплата 30%.", cancellationPolicy: "Возврат 50% за 7 дней."
        ),
        Tour(
            id: "8",
            title: "Дивеево: паломничество к святыням",
            description: "Паломническая поездка в Свято-Троицкий Серафимо-Дивеевский монастырь — Святая Канавка, источники и духовные беседы.",
            image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=600&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&h=600&fit=crop"],
            price: 3900, originalPrice: nil, currency: "₽",
            duration: .multiDay, durationText: "2 дня", transport: .auto, interest: .pilgrimage, city: "moscow",
            organizer: TourOrganizer(id: "org8", name: "Святые места", rating: 4.7, reviewCount: 156, avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&h=100&fit=crop", verified: true, toursCount: 31),
            highlights: ["Святая Канавка", "Святые источники", "Монастырская трапеза"],
            includes: ["Транспорт", "Сопровождающий", "Ночёвка"],
            excludes: ["Пожертвования"],
            schedule: "По выходным", groupSize: "до 30 человек", languages: ["Русский"],
            popularity: 70, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r10", author: "Татьяна Н.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop", rating: 5, text: "Поездка наполнила душу спокойствием. Спасибо организаторам.", date: "2026-01-25")],
            meetingPoint: "Москва, метро Щёлковская", nextAvailableDate: "2026-04-18", startTime: "06:00",
            whatToBring: ["Платок для женщин", "Удобная одежда"], bookingConditions: nil,
            prepayment: "Предоплата 100%.", cancellationPolicy: "Бесплатная отмена за 48 часов."
        ),
    ]

    static let purchasedTours: [BookedTour] = [
        BookedTour(id: "p1", tourId: "1", tourTitle: "Обзорная экскурсия по Москве", tourImage: tours[0].image, tourDate: "2026-03-10", tourStartTime: "10:00", ticketCount: 2, totalPrice: 5000, currency: "₽", confirmationCode: "YV-A1B2C3", status: "completed", firstName: "Иван", lastName: "Петров", contact: "ivan.petrov@email.com", organizerName: "МосТур"),
        BookedTour(id: "p2", tourId: "3", tourTitle: "Белые ночи Петербурга", tourImage: tours[2].image, tourDate: "2026-06-25", tourStartTime: "22:30", ticketCount: 2, totalPrice: 6400, currency: "₽", confirmationCode: "YV-D4E5F6", status: "upcoming", firstName: "Иван", lastName: "Петров", contact: "ivan.petrov@email.com", organizerName: "Северная Звезда"),
    ]

    static let transactions: [Transaction] = [
        Transaction(id: "t1", tourTitle: "Обзорная экскурсия по Москве", tourImage: tours[0].image, amount: 5000, currency: "₽", date: "2026-03-08", status: "completed"),
        Transaction(id: "t2", tourTitle: "Белые ночи Петербурга", tourImage: tours[2].image, amount: 6400, currency: "₽", date: "2026-06-01", status: "completed"),
        Transaction(id: "t3", tourTitle: "Речная прогулка по Москве-реке", tourImage: tours[1].image, amount: 1800, currency: "₽", date: "2026-05-12", status: "pending"),
        Transaction(id: "t4", tourTitle: "Горный маршрут Красная Поляна", tourImage: tours[3].image, amount: 4500, currency: "₽", date: "2026-02-20", status: "refunded"),
    ]

    static let reels: [TravelReel] = [
        TravelReel(id: "rl1", title: "Закат над Невой", city: "spb", tourTitle: "Белые ночи Петербурга", coverImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=900&fit=crop", author: "Анна М.", duration: "0:45", views: "12.4K", likes: "1.2K", likedByMe: false, story: "Невероятный вечер на разводных мостах! Атмосфера белых ночей не передать словами.", status: .published),
        TravelReel(id: "rl2", title: "Лёд Байкала", city: "baikal", tourTitle: "Байкал зимой: лёд и легенды", coverImage: "https://images.unsplash.com/photo-1601814933824-fd0b574dd592?w=600&h=900&fit=crop", author: "Павел Д.", duration: "1:02", views: "28.1K", likes: "3.4K", likedByMe: true, story: "Прозрачный лёд толщиной в метр — будто паришь над бездной.", status: .published),
        TravelReel(id: "rl3", title: "Горы Красной Поляны", city: "sochi", tourTitle: "Горный маршрут Красная Поляна", coverImage: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=900&fit=crop", author: "Олег П.", duration: "0:38", views: "8.9K", likes: "890", likedByMe: false, story: "С высоты 2300 метров открывается весь Кавказ.", status: .published),
        TravelReel(id: "rl4", title: "Огни Москвы", city: "moscow", tourTitle: "Обзорная экскурсия по Москве", coverImage: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&h=900&fit=crop", author: "Мария В.", duration: "0:51", views: "19.7K", likes: "2.1K", likedByMe: false, story: "Ночная Москва с воды — magic!", status: .published),
        TravelReel(id: "rl5", title: "Дюны Балтики", city: "kaliningrad", tourTitle: "Велотур по Куршской косе", coverImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=900&fit=crop", author: "Ирина Л.", duration: "0:44", views: "6.3K", likes: "720", likedByMe: false, story: "Велосипед, ветер и бесконечные дюны.", status: .published),
    ]
}

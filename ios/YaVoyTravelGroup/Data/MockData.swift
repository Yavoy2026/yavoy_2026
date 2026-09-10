//
//  MockData.swift
//  YaVoyTravelGroup
//

import Foundation

enum MockData {
    static let cities: [City] = [
        City(id: "tashkent", name: "Ташкент", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/56ef7bc9-f150-4cb1-a768-760fe959e361.png", tourCount: 214, description: "Столица Узбекистана, базары и современная архитектура", emoji: "🏙"),
        City(id: "samarkand", name: "Самарканд", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/fa103fd8-ada9-451b-bb39-2b204266a6c2.png", tourCount: 187, description: "Жемчужина Шёлкового пути, город Регистана", emoji: "🕌"),
        City(id: "bukhara", name: "Бухара", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/54b1dfd6-74d7-44fe-a843-c975eb172a39.png", tourCount: 132, description: "Город-музей со 140 памятниками", emoji: "🏰"),
        City(id: "khiva", name: "Хива", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/816c2d7e-df74-4de5-b168-5fdccb6cf52e.png", tourCount: 78, description: "Древняя Ичан-Кала под открытым небом", emoji: "🏛"),
        City(id: "chimgan", name: "Чимган и Чарвак", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/6b088c82-6a8d-4abe-9391-323243e21515.png", tourCount: 54, description: "Горы и бирюзовое водохранилище под Ташкентом", emoji: "🏔"),
        City(id: "aidarkul", name: "Айдаркуль", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/d0cbdc13-1f5c-4f4a-9959-2f8bf71e4097.png", tourCount: 32, description: "Юртовые лагеря у озера в пустыне", emoji: "🐪"),
        City(id: "termez", name: "Термез", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/b5630c21-4874-406e-aaf5-b27fcd09d7ef.png", tourCount: 26, description: "Буддийское наследие древнего юга", emoji: "🛕"),
        City(id: "fergana", name: "Ферганская долина", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/82afa6f4-42eb-426c-8105-c681c03601b4.png", tourCount: 41, description: "Шёлк Маргилана и керамика Риштана", emoji: "🎨"),
        City(id: "nukus", name: "Нукус", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/aaf403ed-f848-4342-bc07-d8ecb064bb51.png", tourCount: 19, description: "Музей Савицкого и каньоны Устюрта", emoji: "🏺"),
        City(id: "aral", name: "Муйнак и Арал", image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/1fe83fa0-d4fc-4666-9a46-6a140a54bcca.png", tourCount: 17, description: "Корабельное кладбище и высохшее море", emoji: "🚢"),
    ]

    static var cityNameMap: [String: String] {
        Dictionary(uniqueKeysWithValues: cities.map { ($0.id, $0.name) })
    }

    static func cityName(_ id: String) -> String { cityNameMap[id] ?? id }

    static let tours: [Tour] = [
        Tour(
            id: "1",
            title: "Обзорная экскурсия по Ташкенту",
            description: "Столица Узбекистана за один день: комплекс Хазрати Имам со старейшим Кораном Османа, базар Чорсу, ташкентское метро — один из красивейших в мире, и современный центр с площадью Мустакиллик.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/56ef7bc9-f150-4cb1-a768-760fe959e361.png",
            gallery: [
                "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/16238f5b-4a39-4a03-a89a-e470a6bb41d5.png",
                "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/bf76c3ad-6b19-4637-b875-79f051c4cabd.png",
            ],
            price: 250000, originalPrice: 320000, currency: "сум",
            duration: .oneDay, durationText: "4 часа", transport: .auto, interest: .city, city: "tashkent",
            organizer: TourOrganizer(id: "org1", name: "Ташкент Гид", rating: 4.8, reviewCount: 342, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", verified: true, toursCount: 28),
            highlights: ["Хазрати Имам и Коран Османа", "Базар Чорсу", "Ташкентское метро", "Площадь Мустакиллик"],
            includes: ["Транспорт", "Профессиональный гид", "Входные билеты", "Дегустация сухофруктов"],
            excludes: ["Питание", "Сувениры"],
            schedule: "Ежедневно в 10:00, 14:00", groupSize: "до 15 человек", languages: ["Русский", "English"],
            popularity: 95, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: true,
            reviews: [
                TourReview(id: "r1", author: "Анна М.", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", rating: 5, text: "Ташкент удивил! Метро — настоящий подземный музей.", date: "2026-03-20"),
                TourReview(id: "r2", author: "Дмитрий К.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", rating: 5, text: "Отличный гид, базар Чорсу — восторг для фотографа.", date: "2026-03-15"),
            ],
            meetingPoint: "Отель «Узбекистан», центральный вход", nextAvailableDate: "2026-07-08", startTime: "10:00",
            whatToBring: ["Удобная обувь", "Головной убор", "Бутылка воды", "Фотоаппарат"],
            bookingConditions: "Бронирование подтверждается мгновенно. Дети до 7 лет — бесплатно.",
            prepayment: "Предоплата 100%. Оплата UzCard/Humo, Visa, Payme/Click.",
            cancellationPolicy: "Бесплатная отмена за 24 часа до начала."
        ),
        Tour(
            id: "2",
            title: "Самарканд: Регистан, Гур-Эмир и Биби-Ханум",
            description: "Жемчужина Шёлкового пути за один день: величественный ансамбль Регистан с тремя медресе, мавзолей Гур-Эмир с надгробием Тамерлана, мечеть Биби-Ханум и базар Сиаб.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/fa103fd8-ada9-451b-bb39-2b204266a6c2.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/bf76c3ad-6b19-4637-b875-79f051c4cabd.png"],
            price: 450000, originalPrice: 520000, currency: "сум",
            duration: .oneDay, durationText: "6 часов", transport: .auto, interest: .educational, city: "samarkand",
            organizer: TourOrganizer(id: "org2", name: "Регистан Тревел", rating: 4.9, reviewCount: 521, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", verified: true, toursCount: 41),
            highlights: ["Ансамбль Регистан", "Мавзолей Гур-Эмир", "Мечеть Биби-Ханум", "Базар Сиаб"],
            includes: ["Транспорт по городу", "Гид-историк", "Все входные билеты", "Вода"],
            excludes: ["Обед", "Сувениры"],
            schedule: "Ежедневно в 09:00, 14:00", groupSize: "до 18 человек", languages: ["Русский", "English"],
            popularity: 98, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r5", author: "Ольга П.", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop", rating: 5, text: "Регистан превзошёл все ожидания! Мурашки от красоты изразцов.", date: "2026-03-25")],
            meetingPoint: "Ансамбль Регистан, центральная площадь", nextAvailableDate: "2026-07-09", startTime: "09:00",
            whatToBring: ["Удобная обувь", "Головной убор", "Солнцезащитный крем"],
            bookingConditions: "Мгновенное подтверждение. Требуются ФИО всех участников.",
            prepayment: "Полная предоплата при бронировании онлайн.",
            cancellationPolicy: "Бесплатная отмена за 24 часа."
        ),
        Tour(
            id: "3",
            title: "Шахи-Зинда на рассвете: фототур",
            description: "Самый фотогеничный маршрут Самарканда до толп туристов: бирюзовый коридор мавзолеев Шахи-Зинда на рассвете, обсерватория Улугбека и лучшие точки для съёмки Регистана.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/bf76c3ad-6b19-4637-b875-79f051c4cabd.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/fa103fd8-ada9-451b-bb39-2b204266a6c2.png"],
            price: 280000, originalPrice: nil, currency: "сум",
            duration: .oneDay, durationText: "3 часа", transport: .auto, interest: .city, city: "samarkand",
            organizer: TourOrganizer(id: "org2", name: "Регистан Тревел", rating: 4.9, reviewCount: 521, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", verified: true, toursCount: 41),
            highlights: ["Шахи-Зинда без туристов", "Обсерватория Улугбека", "Рассветный свет"],
            includes: ["Транспорт", "Гид", "Входные билеты"],
            excludes: ["Обед"],
            schedule: "Ежедневно в 05:30", groupSize: "до 8 человек", languages: ["Русский", "English"],
            popularity: 90, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r7", author: "Тимур Х.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", rating: 5, text: "Рассвет на Шахи-Зинда — то, что нужно увидеть каждому.", date: "2026-03-15")],
            meetingPoint: "Некрополь Шахи-Зинда, нижняя группа", nextAvailableDate: "2026-07-10", startTime: "05:30",
            whatToBring: ["Камера", "Штатив", "Тёплая кофта на рассвет"],
            bookingConditions: "Мгновенное подтверждение. Будильник на 04:30!",
            prepayment: "Полная предоплата.",
            cancellationPolicy: "Бесплатная отмена за 24 часа."
        ),
        Tour(
            id: "4",
            title: "Старая Бухара пешком",
            description: "Исторический центр Бухары — объект ЮНЕСКО: ансамбль Пои-Калян с минаретом высотой 46 метров, крепость Арк, ансамбль Ляби-Хауз и торговые купола XVI века.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/54b1dfd6-74d7-44fe-a843-c975eb172a39.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/82afa6f4-42eb-426c-8105-c681c03601b4.png"],
            price: 260000, originalPrice: nil, currency: "сум",
            duration: .oneDay, durationText: "4 часа", transport: .auto, interest: .city, city: "bukhara",
            organizer: TourOrganizer(id: "org3", name: "Старая Бухара", rating: 4.8, reviewCount: 276, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", verified: true, toursCount: 19),
            highlights: ["Минарет Пои-Калян", "Крепость Арк", "Ляби-Хауз", "Торговые купола"],
            includes: ["Гид", "Входные билеты", "Чай в караван-сарае"],
            excludes: ["Питание"],
            schedule: "Ежедневно в 09:00, 16:00", groupSize: "до 15 человек", languages: ["Русский", "English"],
            popularity: 92, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: false,
            reviews: [TourReview(id: "r9", author: "Виктор Б.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop", rating: 5, text: "Бухара — город-сказка. Чай в караван-сарае бесценен.", date: "2026-03-18")],
            meetingPoint: "Ансамбль Пои-Калян", nextAvailableDate: "2026-07-09", startTime: "09:00",
            whatToBring: ["Удобная обувь", "Головной убор", "Бутылка воды"],
            bookingConditions: nil,
            prepayment: "Полная предоплата онлайн.",
            cancellationPolicy: "Бесплатная отмена за 24 часа."
        ),
        Tour(
            id: "5",
            title: "Хива: Ичан-Кала — город-музей",
            description: "Целый город-крепость под открытым небом: Джума-мечеть с 213 резными колоннами, минарет Ислам-Ходжа, гарем Куня-Арк и башня Кальта-Минор. Финал — закат с крепостной стены.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/816c2d7e-df74-4de5-b168-5fdccb6cf52e.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/aaf403ed-f848-4342-bc07-d8ecb064bb51.png"],
            price: 380000, originalPrice: nil, currency: "сум",
            duration: .oneDay, durationText: "5 часов", transport: .auto, interest: .educational, city: "khiva",
            organizer: TourOrganizer(id: "org4", name: "Хива Гид", rating: 4.7, reviewCount: 198, avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop", verified: true, toursCount: 23),
            highlights: ["Джума-мечеть", "Кальта-Минор", "Минарет Ислам-Ходжа", "Закат со стены"],
            includes: ["Гид", "Все входные билеты", "Фольклорное шоу"],
            excludes: ["Обед", "Трансфер из Ургенча"],
            schedule: "Ежедневно в 09:00", groupSize: "до 16 человек", languages: ["Русский", "English"],
            popularity: 89, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r12", author: "Рустам Г.", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=80&h=80&fit=crop", rating: 5, text: "Хива — как декорация к фильму. Закат со стены незабываем.", date: "2026-02-28")],
            meetingPoint: "Западные ворота Ата-Дарвоза", nextAvailableDate: "2026-07-11", startTime: "09:00",
            whatToBring: ["Удобная обувь", "Головной убор", "Бутылка воды"],
            bookingConditions: "Внутри мечети — закрытая одежда.",
            prepayment: "Предоплата 100%.",
            cancellationPolicy: "Бесплатная отмена за 24 часа."
        ),
        Tour(
            id: "6",
            title: "Треккинг по Чимгану и Большому Чимгану",
            description: "Многодневный треккинг в горах Западного Тянь-Шаня: плато Кумбель, водопады Гулькама и Чарвакские пейзажи. Ночёвка в горном приюте, питание и инструктор включены.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/6b088c82-6a8d-4abe-9391-323243e21515.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/d0cbdc13-1f5c-4f4a-9959-2f8bf71e4097.png"],
            price: 1200000, originalPrice: 1400000, currency: "сум",
            duration: .multiDay, durationText: "2 дня", transport: .auto, interest: .nature, city: "chimgan",
            organizer: TourOrganizer(id: "org5", name: "Горы Узбекистана", rating: 4.7, reviewCount: 207, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", verified: true, toursCount: 16),
            highlights: ["Вершина Большой Чимган", "Плато Кумбель", "Водопады Гулькама", "Ночёвка в приюте"],
            includes: ["Трансфер из Ташкента", "Питание", "Проживание", "Инструктор"],
            excludes: ["Личные расходы", "Снаряжение"],
            schedule: "Май–октябрь, выезд по субботам", groupSize: "4–10 человек", languages: ["Русский", "English"],
            popularity: 84, isInstantConfirmation: false, isFreeCancellation: true, isBestseller: false, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r14", author: "Дмитрий К.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", rating: 5, text: "Горы потрясающие! Инструктор — профессионал.", date: "2026-03-12")],
            meetingPoint: "Ташкент, ст. метро «Бунёдкор»", nextAvailableDate: "2026-07-18", startTime: "07:00",
            whatToBring: ["Трекинговая обувь", "Дождевик", "Рюкзак 20-30 литров", "Личная аптечка"],
            bookingConditions: "Бронирование за 3 дня до начала.",
            prepayment: "Предоплата 30%.",
            cancellationPolicy: "Бесплатная отмена за 7 дней."
        ),
        Tour(
            id: "7",
            title: "Юртовый лагерь на Айдаркуле: верблюды и звёзды",
            description: "Два дня в пустыне Кызылкум: ночёвка в национальных юртах у озера Айдаркуль, катание на верблюдах до заката, плов у костра и звёздное небо без единого огня.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/d0cbdc13-1f5c-4f4a-9959-2f8bf71e4097.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/aaf403ed-f848-4342-bc07-d8ecb064bb51.png"],
            price: 1800000, originalPrice: 2100000, currency: "сум",
            duration: .multiDay, durationText: "2 дня", transport: .auto, interest: .nature, city: "aidarkul",
            organizer: TourOrganizer(id: "org6", name: "Юртовый лагерь Нур", rating: 4.9, reviewCount: 98, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop", verified: true, toursCount: 9),
            highlights: ["Ночь в юрте", "Верблюды на закате", "Плов у костра", "Купание в Айдаркуле"],
            includes: ["Трансфер из Самарканда", "Юрта", "Всё питание", "Верблюды", "Фольклор"],
            excludes: ["Напитки", "Личные расходы"],
            schedule: "Заезды ежедневно", groupSize: "до 12 человек", languages: ["Русский", "English"],
            popularity: 94, isInstantConfirmation: true, isFreeCancellation: true, isBestseller: true, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r16", author: "Павел Д.", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop", rating: 5, text: "Звёздное небо над Кызылкумом — лучшее, что я видел!", date: "2026-02-10")],
            meetingPoint: "Отель в Самарканде — трансфер", nextAvailableDate: "2026-07-09", startTime: "09:00",
            whatToBring: ["Купальник", "Тёплая кофта на ночь", "Фонарик", "Репеллент"],
            bookingConditions: "Бронирование за 2 дня. Юрты рассчитаны на 4-6 человек.",
            prepayment: "Предоплата 30%.",
            cancellationPolicy: "Бесплатная отмена за 72 часа."
        ),
        Tour(
            id: "8",
            title: "Вертолёт над Аралом и Устюртом",
            description: "Полёт на вертолёте над бывшим дном Аральского моря: белые скалы Устюрта, затонувшие корабли с высоты и южный берег Арала. Посадка на плато с пикником и фотосессией.",
            image: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/aaf403ed-f848-4342-bc07-d8ecb064bb51.png",
            gallery: ["https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/1fe83fa0-d4fc-4666-9a46-6a140a54bcca.png"],
            price: 3500000, originalPrice: 4200000, currency: "сум",
            duration: .oneDay, durationText: "3 часа", transport: .air, interest: .nature, city: "aral",
            organizer: TourOrganizer(id: "org7", name: "Устюрт Экспедиция", rating: 4.8, reviewCount: 134, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop", verified: true, toursCount: 12),
            highlights: ["Панорама Устюрта с высоты", "Бывшее дно Арала", "Пикник на плато", "Фотосессия"],
            includes: ["Вертолёт", "Пилот-гид", "Пикник", "Страховка"],
            excludes: ["Трансфер в Нукус", "Проживание"],
            schedule: "Апрель–сентябрь, по погоде", groupSize: "3–5 человек", languages: ["Русский", "English"],
            popularity: 91, isInstantConfirmation: false, isFreeCancellation: false, isBestseller: true, isLikelyToSellOut: true,
            reviews: [TourReview(id: "r21", author: "Сергей М.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop", rating: 5, text: "Бывшее дно Арала с высоты — это космос!", date: "2026-03-05")],
            meetingPoint: "Аэропорт Нукус", nextAvailableDate: "2026-07-20", startTime: "10:00",
            whatToBring: ["Тёплая куртка", "Солнцезащитные очки", "Фотоаппарат", "Паспорт"],
            bookingConditions: "Бронирование за 7 дней. Возрастное ограничение — от 12 лет.",
            prepayment: "Полная предоплата.",
            cancellationPolicy: "Отмена невозможна. Замена участника — за 3 дня."
        ),
    ]

    static let purchasedTours: [BookedTour] = [
        BookedTour(id: "p1", tourId: "1", tourTitle: "Обзорная экскурсия по Ташкенту", tourImage: tours[0].image, tourDate: "2026-07-10", tourStartTime: "10:00", ticketCount: 2, totalPrice: 500000, currency: "сум", confirmationCode: "YV-TAS-2841", status: "upcoming", firstName: "Иван", lastName: "Петров", contact: "ivan.petrov@email.com", organizerName: "Ташкент Гид"),
        BookedTour(id: "p2", tourId: "2", tourTitle: "Самарканд: Регистан, Гур-Эмир и Биби-Ханум", tourImage: tours[1].image, tourDate: "2026-07-09", tourStartTime: "09:00", ticketCount: 2, totalPrice: 900000, currency: "сум", confirmationCode: "YV-SAM-1923", status: "upcoming", firstName: "Иван", lastName: "Петров", contact: "ivan.petrov@email.com", organizerName: "Регистан Тревел"),
    ]

    static let transactions: [Transaction] = [
        Transaction(id: "t1", tourTitle: "Обзорная экскурсия по Ташкенту", tourImage: tours[0].image, amount: 500000, currency: "сум", date: "2026-03-08", status: "completed"),
        Transaction(id: "t2", tourTitle: "Самарканд: Регистан, Гур-Эмир и Биби-Ханум", tourImage: tours[1].image, amount: 900000, currency: "сум", date: "2026-06-01", status: "completed"),
        Transaction(id: "t3", tourTitle: "Старая Бухара пешком", tourImage: tours[3].image, amount: 520000, currency: "сум", date: "2026-05-12", status: "pending"),
        Transaction(id: "t4", tourTitle: "Треккинг по Чимгану и Большому Чимгану", tourImage: tours[5].image, amount: 2400000, currency: "сум", date: "2026-02-20", status: "refunded"),
    ]

    static let reels: [TravelReel] = [
        TravelReel(id: "rl1", title: "Рассвет над Регистаном", city: "samarkand", tourTitle: "Самарканд: Регистан, Гур-Эмир и Биби-Ханум", coverImage: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/fa103fd8-ada9-451b-bb39-2b204266a6c2.png", author: "Дилноза · гид YAVAY", duration: "0:45", views: "12.4K", likes: "1.2K", likedByMe: false, story: "Первые лучи солнца зажигают бирюзовые купола трёх медресе. Легенды Улугбека звучат совсем иначе на рассвете.", status: .published),
        TravelReel(id: "rl2", title: "Ночь в юрте у озера", city: "aidarkul", tourTitle: "Юртовый лагерь на Айдаркуле: верблюды и звёзды", coverImage: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/d0cbdc13-1f5c-4f4a-9959-2f8bf71e4097.png", author: "Гульнара · хозяйка лагеря", duration: "1:02", views: "28.1K", likes: "3.4K", likedByMe: true, story: "Закат над Айдаркулем, верблюды и миллион звёзд над Кызылкумом.", status: .published),
        TravelReel(id: "rl3", title: "Корабли в пустыне", city: "aral", tourTitle: "Вертолёт над Аралом и Устюртом", coverImage: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/1fe83fa0-d4fc-4666-9a46-6a140a54bcca.png", author: "Сафар · локальный эксперт", duration: "0:38", views: "8.9K", likes: "890", likedByMe: false, story: "Ржавые суда стоят посреди песков там, где было море.", status: .published),
        TravelReel(id: "rl4", title: "Бирюзовый коридор", city: "samarkand", tourTitle: "Шахи-Зинда на рассвете: фототур", coverImage: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/bf76c3ad-6b19-4637-b875-79f051c4cabd.png", author: "Тимур · фотограф", duration: "0:51", views: "19.7K", likes: "2.1K", likedByMe: false, story: "Изразцы всех оттенков синего — лучшие кадры Самарканда.", status: .published),
        TravelReel(id: "rl5", title: "Плов из гигантского казана", city: "tashkent", tourTitle: "Вечерний Ташкент и плов-центр", coverImage: "https://r2-pub.rork.com/projects/x44o879wofll24vz6ssht/assets/16238f5b-4a39-4a03-a89a-e470a6bb41d5.png", author: "Мария В.", duration: "0:44", views: "6.3K", likes: "720", likedByMe: false, story: "Триста литров риса, зиры и моркови — ташкентский плов в Бешкозоне.", status: .published),
    ]
}

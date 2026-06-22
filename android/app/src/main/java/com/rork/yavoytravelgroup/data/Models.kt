package com.rork.yavoytravelgroup.data

/** Core domain models mirroring the React Native / web type definitions. */

enum class DurationType(val key: String, val label: String) {
    ONE_DAY("one_day", "Однодневные"),
    MULTI_DAY("multi_day", "Многодневные");

    companion object {
        fun fromKey(key: String?): DurationType? = entries.firstOrNull { it.key == key }
    }
}

enum class TransportType(val key: String, val label: String) {
    AUTO("auto", "Авто"),
    WATER("water", "Водные"),
    SEA("sea", "Морские"),
    BIKE("bike", "Вело"),
    AIR("air", "Авиа");

    companion object {
        fun fromKey(key: String?): TransportType? = entries.firstOrNull { it.key == key }
    }
}

enum class InterestType(val key: String, val label: String) {
    CITY("city", "Городские"),
    EDUCATIONAL("educational", "Познавательные"),
    NATURE("nature", "Природные"),
    PILGRIMAGE("pilgrimage", "Паломничество");

    companion object {
        fun fromKey(key: String?): InterestType? = entries.firstOrNull { it.key == key }
    }
}

enum class SortType(val key: String, val label: String) {
    POPULARITY("popularity", "Популярные"),
    NEWEST("newest", "Новинки"),
    PRICE_ASC("price_asc", "Дешевле"),
    PRICE_DESC("price_desc", "Дороже"),
}

data class TourReview(
    val id: String,
    val author: String,
    val avatar: String,
    val rating: Int,
    val text: String,
    val date: String,
)

data class TourOrganizer(
    val id: String,
    val name: String,
    val rating: Double,
    val reviewCount: Int,
    val avatar: String,
    val verified: Boolean,
    val toursCount: Int,
)

data class Tour(
    val id: String,
    val title: String,
    val description: String,
    val image: String,
    val gallery: List<String> = emptyList(),
    val price: Int,
    val originalPrice: Int? = null,
    val currency: String = "₽",
    val duration: DurationType,
    val durationText: String,
    val transport: TransportType,
    val interest: InterestType,
    val city: String,
    val organizer: TourOrganizer,
    val highlights: List<String> = emptyList(),
    val includes: List<String> = emptyList(),
    val excludes: List<String> = emptyList(),
    val schedule: String = "",
    val groupSize: String = "",
    val languages: List<String> = emptyList(),
    val popularity: Int = 0,
    val isInstantConfirmation: Boolean = false,
    val isFreeCancellation: Boolean = false,
    val isBestseller: Boolean = false,
    val isLikelyToSellOut: Boolean = false,
    val reviews: List<TourReview> = emptyList(),
    val meetingPoint: String? = null,
    val nextAvailableDate: String = "",
    val bookingsToday: Int = 0,
    val startTime: String? = null,
    val whatToBring: List<String> = emptyList(),
    val cancellationPolicy: String? = null,
)

data class City(
    val id: String,
    val name: String,
    val image: String,
    val tourCount: Int,
    val description: String,
    val emoji: String,
)

data class TravelReel(
    val id: String,
    val title: String,
    val city: String,
    val tourTitle: String,
    val coverImage: String,
    val videoUri: String? = null,
    val author: String,
    val duration: String,
    val views: String,
    val likes: String,
    val likesCount: Int,
    val likedByMe: Boolean = false,
    val story: String,
)

data class Transaction(
    val id: String,
    val tourTitle: String,
    val tourImage: String,
    val amount: Int,
    val currency: String,
    val date: String,
    val status: String, // completed | pending | refunded
)

data class PurchasedTour(
    val id: String,
    val tour: Tour,
    val purchaseDate: String,
    val tourDate: String,
    val ticketCount: Int,
    val confirmationCode: String,
    val status: String, // upcoming | completed | cancelled
)

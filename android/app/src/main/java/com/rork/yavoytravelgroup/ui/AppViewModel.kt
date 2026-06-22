package com.rork.yavoytravelgroup.ui

import androidx.lifecycle.ViewModel
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.data.TravelReel
import com.rork.yavoytravelgroup.ui.theme.ThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class AppUiState(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val favoriteTourIds: Set<String> = emptySet(),
    val favoriteCityIds: Set<String> = emptySet(),
    val loyaltyPoints: Int = 4250,
    val reels: List<TravelReel> = MockData.reels,
)

/** Holds shared client-side state: theme, favorites, loyalty, reels. */
class AppViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(AppUiState())
    val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()

    fun setTheme(mode: ThemeMode) {
        _uiState.value = _uiState.value.copy(themeMode = mode)
    }

    fun toggleFavoriteTour(id: String) {
        val current = _uiState.value.favoriteTourIds
        _uiState.value = _uiState.value.copy(
            favoriteTourIds = if (id in current) current - id else current + id
        )
    }

    fun isFavoriteTour(id: String): Boolean = id in _uiState.value.favoriteTourIds

    fun toggleFavoriteCity(id: String) {
        val current = _uiState.value.favoriteCityIds
        _uiState.value = _uiState.value.copy(
            favoriteCityIds = if (id in current) current - id else current + id
        )
    }

    fun toggleReelLike(id: String) {
        _uiState.value = _uiState.value.copy(
            reels = _uiState.value.reels.map { reel ->
                if (reel.id == id) {
                    val liked = !reel.likedByMe
                    reel.copy(
                        likedByMe = liked,
                        likesCount = reel.likesCount + if (liked) 1 else -1,
                    )
                } else reel
            }
        )
    }
}

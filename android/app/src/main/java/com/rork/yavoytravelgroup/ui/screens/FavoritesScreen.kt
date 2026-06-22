package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.ui.components.FilterChip
import com.rork.yavoytravelgroup.ui.components.TourCard
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun FavoritesScreen(
    favoriteTourIds: Set<String>,
    favoriteCityIds: Set<String>,
    onTourClick: (String) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onToggleFavoriteCity: (String) -> Unit,
    onCityClick: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val colors = LocalYaVoyColors.current
    var tab by remember { mutableStateOf("tours") }

    val favoriteTours = MockData.tours.filter { it.id in favoriteTourIds }
    val favoriteCities = MockData.cities.filter { it.id in favoriteCityIds }

    Column(
        Modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(top = contentPadding.calculateTopPadding()),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            FilterChip("Экскурсии (${favoriteTours.size})", tab == "tours", { tab = "tours" })
            FilterChip("Города (${favoriteCities.size})", tab == "cities", { tab = "cities" })
        }

        if (tab == "tours") {
            if (favoriteTours.isEmpty()) {
                EmptyFavorites("Нет избранных экскурсий", "Нажмите на сердечко на карточке, чтобы добавить")
            } else {
                LazyColumn(contentPadding = PaddingValues(bottom = contentPadding.calculateBottomPadding() + 16.dp)) {
                    items(favoriteTours, key = { it.id }) { tour ->
                        TourCard(tour, isFavorite = true, onClick = { onTourClick(tour.id) }, onToggleFavorite = { onToggleFavorite(tour.id) })
                    }
                }
            }
        } else {
            if (favoriteCities.isEmpty()) {
                EmptyFavorites("Нет избранных городов", "Отметьте города как избранные")
            } else {
                LazyColumn(contentPadding = PaddingValues(bottom = contentPadding.calculateBottomPadding() + 16.dp)) {
                    items(favoriteCities, key = { it.id }) { city ->
                        Surface(
                            onClick = { onCityClick(city.id) },
                            color = colors.surface,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                        ) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                AsyncImage(model = city.image, contentDescription = city.name, contentScale = ContentScale.Crop, modifier = Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)))
                                Column(Modifier.padding(start = 12.dp).weight(1f)) {
                                    Text("${city.emoji} ${city.name}", color = colors.text, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text(city.description, color = colors.textMuted, fontSize = 12.sp)
                                }
                                Surface(onClick = { onToggleFavoriteCity(city.id) }, shape = CircleShape, color = colors.surfaceSecondary, modifier = Modifier.size(34.dp)) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Filled.Favorite, null, tint = colors.coral, modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyFavorites(title: String, sub: String) {
    val colors = LocalYaVoyColors.current
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(40.dp)) {
            Surface(shape = CircleShape, color = colors.surfaceSecondary, modifier = Modifier.size(80.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Favorite, null, tint = colors.textMuted, modifier = Modifier.size(40.dp))
                }
            }
            Text(title, color = colors.text, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 20.dp))
            Text(sub, color = colors.textMuted, fontSize = 14.sp)
        }
    }
}

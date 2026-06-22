package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.DurationType
import com.rork.yavoytravelgroup.data.InterestType
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.data.SortType
import com.rork.yavoytravelgroup.data.Tour
import com.rork.yavoytravelgroup.data.TransportType
import com.rork.yavoytravelgroup.ui.components.AdvantagesBlock
import com.rork.yavoytravelgroup.ui.components.FilterChip
import com.rork.yavoytravelgroup.ui.components.SectionTitle
import com.rork.yavoytravelgroup.ui.components.TourCard
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun HomeScreen(
    favoriteIds: Set<String>,
    reelsCount: Int,
    onTourClick: (String) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onOpenReels: () -> Unit,
    contentPadding: PaddingValues,
) {
    val colors = LocalYaVoyColors.current
    var selectedCity by remember { mutableStateOf<String?>(null) }
    var search by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf<DurationType?>(null) }
    var transport by remember { mutableStateOf<TransportType?>(null) }
    var interest by remember { mutableStateOf<InterestType?>(null) }
    var sort by remember { mutableStateOf(SortType.POPULARITY) }

    val filtered = remember(selectedCity, search, duration, transport, interest, sort) {
        var result = MockData.tours
        selectedCity?.let { c -> result = result.filter { it.city == c } }
        duration?.let { d -> result = result.filter { it.duration == d } }
        transport?.let { t -> result = result.filter { it.transport == t } }
        interest?.let { i -> result = result.filter { it.interest == i } }
        if (search.isNotBlank()) {
            val q = search.lowercase().trim()
            result = result.filter {
                it.title.lowercase().contains(q) ||
                    it.description.lowercase().contains(q) ||
                    (MockData.cityNameMap[it.city] ?: "").lowercase().contains(q)
            }
        }
        when (sort) {
            SortType.POPULARITY -> result.sortedByDescending { it.popularity }
            SortType.NEWEST -> result.sortedBy { it.nextAvailableDate }
            SortType.PRICE_ASC -> result.sortedBy { it.price }
            SortType.PRICE_DESC -> result.sortedByDescending { it.price }
        }
    }

    val hasFilters = selectedCity != null || duration != null || transport != null ||
        interest != null || search.isNotBlank()

    LazyColumn(
        modifier = Modifier.background(colors.background),
        contentPadding = PaddingValues(
            top = contentPadding.calculateTopPadding(),
            bottom = contentPadding.calculateBottomPadding() + 24.dp,
        ),
    ) {
        item {
            // Search
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                placeholder = { Text("Поиск экскурсий, городов...") },
                leadingIcon = { Icon(Icons.Filled.Search, null, tint = colors.textMuted) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.teal,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.surface,
                    unfocusedContainerColor = colors.surface,
                    focusedTextColor = colors.text,
                    unfocusedTextColor = colors.text,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
            )
        }

        item { SectionTitle("Куда поедем?") }
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(MockData.cities) { city ->
                    CityChip(
                        name = city.name,
                        emoji = city.emoji,
                        image = city.image,
                        selected = selectedCity == city.id,
                        onClick = { selectedCity = if (selectedCity == city.id) null else city.id },
                    )
                }
            }
        }

        if (!hasFilters) {
            item { SectionTitle("Reels из путешествий") }
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(MockData.reels) { reel ->
                        Box(
                            modifier = Modifier
                                .width(120.dp)
                                .height(180.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .clickable(onClick = onOpenReels),
                        ) {
                            AsyncImage(
                                model = reel.coverImage,
                                contentDescription = reel.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxWidth().height(180.dp),
                            )
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(Color.Transparent, Color(0xCC000000))
                                        )
                                    )
                            )
                            Text(
                                text = reel.title,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.align(Alignment.BottomStart).padding(8.dp),
                            )
                        }
                    }
                }
            }

            item { SectionTitle("Популярные экскурсии") }
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(MockData.popularTours) { tour ->
                        PopularCard(tour, onClick = { onTourClick(tour.id) })
                    }
                }
            }
        }

        // Filters
        item {
            Column(Modifier.padding(top = 16.dp)) {
                FilterRow(
                    title = "Длительность",
                    options = DurationType.entries.map { it.key to it.label },
                    selectedKey = duration?.key,
                    onSelect = { key -> duration = if (duration?.key == key) null else DurationType.fromKey(key) },
                )
                FilterRow(
                    title = "Транспорт",
                    options = TransportType.entries.map { it.key to it.label },
                    selectedKey = transport?.key,
                    onSelect = { key -> transport = if (transport?.key == key) null else TransportType.fromKey(key) },
                )
                FilterRow(
                    title = "Интересы",
                    options = InterestType.entries.map { it.key to it.label },
                    selectedKey = interest?.key,
                    onSelect = { key -> interest = if (interest?.key == key) null else InterestType.fromKey(key) },
                )
                FilterRow(
                    title = "Сортировка",
                    options = SortType.entries.map { it.key to it.label },
                    selectedKey = sort.key,
                    onSelect = { key -> SortType.entries.firstOrNull { it.key == key }?.let { sort = it } },
                )
            }
        }

        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = selectedCity?.let { MockData.cityNameMap[it] } ?: "Все направления",
                        color = colors.text,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Text("${filtered.size} экскурсий", color = colors.textMuted, fontSize = 13.sp)
                }
                if (hasFilters) {
                    Text(
                        text = "Сбросить",
                        color = colors.teal,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable {
                            selectedCity = null; duration = null; transport = null
                            interest = null; search = ""
                        },
                    )
                }
            }
        }

        items(filtered, key = { it.id }) { tour ->
            TourCard(
                tour = tour,
                isFavorite = tour.id in favoriteIds,
                onClick = { onTourClick(tour.id) },
                onToggleFavorite = { onToggleFavorite(tour.id) },
            )
        }

        if (filtered.isEmpty()) {
            item {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text("🧭", fontSize = 48.sp)
                    Text("Экскурсии не найдены", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("Попробуйте изменить фильтры", color = colors.textMuted, fontSize = 14.sp)
                }
            }
        }

        item { AdvantagesBlock() }
    }
}

@Composable
private fun FilterRow(
    title: String,
    options: List<Pair<String, String>>,
    selectedKey: String?,
    onSelect: (String) -> Unit,
) {
    val colors = LocalYaVoyColors.current
    Text(
        text = title,
        color = colors.textSecondary,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(start = 16.dp, top = 10.dp, bottom = 6.dp),
    )
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(options) { (key, label) ->
            FilterChip(label = label, selected = selectedKey == key, onClick = { onSelect(key) })
        }
    }
}

@Composable
private fun CityChip(name: String, emoji: String, image: String, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(76.dp).clickable(onClick = onClick),
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(RoundedCornerShape(20.dp)),
        ) {
            AsyncImage(model = image, contentDescription = name, contentScale = ContentScale.Crop, modifier = Modifier.size(64.dp))
            if (selected) {
                Box(Modifier.size(64.dp).background(colors.teal.copy(alpha = 0.45f)))
            }
            Text(emoji, fontSize = 22.sp, modifier = Modifier.align(Alignment.Center))
        }
        Text(
            text = name,
            color = if (selected) colors.teal else colors.textSecondary,
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun PopularCard(tour: Tour, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = colors.surface,
        modifier = Modifier.width(220.dp),
    ) {
        Column {
            AsyncImage(
                model = tour.image,
                contentDescription = tour.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().height(120.dp),
            )
            Column(Modifier.padding(10.dp)) {
                Text(tour.title, color = colors.text, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text("${tour.price}${tour.currency}", color = colors.teal, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

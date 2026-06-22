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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.City
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun ExploreScreen(
    onCityClick: (String) -> Unit,
    onTourClick: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val colors = LocalYaVoyColors.current
    val topRated = remember { MockData.tours.sortedByDescending { it.organizer.rating }.take(5) }

    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.background(colors.background),
        contentPadding = PaddingValues(
            start = 12.dp, end = 12.dp,
            top = contentPadding.calculateTopPadding() + 12.dp,
            bottom = contentPadding.calculateBottomPadding() + 24.dp,
        ),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
            Text(
                "Популярные города",
                color = colors.text,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 4.dp, top = 4.dp, bottom = 4.dp),
            )
        }
        items(MockData.cities) { city ->
            CityGridCard(city, onClick = { onCityClick(city.id) })
        }

        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
            Column(Modifier.padding(top = 16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)) {
                    Icon(Icons.Filled.Star, null, tint = colors.gold, modifier = Modifier.size(18.dp))
                    Text(" Лучшие по рейтингу", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                topRated.forEachIndexed { index, tour ->
                    Surface(
                        onClick = { onTourClick(tour.id) },
                        color = colors.surface,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    ) {
                        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = RoundedCornerShape(12.dp), color = colors.tealSoft, modifier = Modifier.size(26.dp)) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("${index + 1}", color = colors.teal, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                            AsyncImage(
                                model = tour.image,
                                contentDescription = tour.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.padding(start = 10.dp).size(48.dp).clip(RoundedCornerShape(10.dp)),
                            )
                            Column(Modifier.padding(start = 10.dp).weight(1f)) {
                                Text(tour.title, color = colors.text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.Star, null, tint = colors.gold, modifier = Modifier.size(12.dp))
                                    Text(" ${tour.organizer.rating} (${tour.organizer.reviewCount})", color = colors.textMuted, fontSize = 12.sp)
                                }
                                Text("от ${tour.price}${tour.currency}", color = colors.teal, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = colors.textMuted)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CityGridCard(city: City, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(model = city.image, contentDescription = city.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().height(140.dp))
        Box(Modifier.fillMaxWidth().height(140.dp).background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xCC000000)))))
        Column(Modifier.align(Alignment.BottomStart).padding(10.dp)) {
            Text(city.emoji, fontSize = 20.sp)
            Text(city.name, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Surface(shape = RoundedCornerShape(8.dp), color = Color(0x33FFFFFF), modifier = Modifier.padding(top = 4.dp)) {
                Text("${city.tourCount} туров", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
            }
        }
    }
}

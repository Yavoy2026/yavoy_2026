package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.data.Tour
import com.rork.yavoytravelgroup.data.TourReview
import com.rork.yavoytravelgroup.ui.components.StarRating
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun TourDetailScreen(
    tourId: String,
    isFavorite: Boolean,
    onBack: () -> Unit,
    onToggleFavorite: () -> Unit,
) {
    val colors = LocalYaVoyColors.current
    val tour = MockData.tourById(tourId)

    if (tour == null) {
        Box(Modifier.fillMaxSize().background(colors.background), contentAlignment = Alignment.Center) {
            Text("Экскурсия не найдена", color = colors.text)
        }
        return
    }

    Box(Modifier.fillMaxSize().background(colors.background)) {
        LazyColumn(Modifier.fillMaxSize()) {
            item {
                Box {
                    AsyncImage(
                        model = tour.image,
                        contentDescription = tour.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().height(320.dp),
                    )
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(320.dp)
                            .background(Brush.verticalGradient(listOf(Color(0x55000000), Color.Transparent, Color(0x99000000))))
                    )
                }
            }

            item {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.LocationOn, null, tint = colors.teal, modifier = Modifier.size(15.dp))
                        Text(" ${MockData.cityNameMap[tour.city] ?: tour.city}", color = colors.textSecondary, fontSize = 14.sp)
                        Text(" · ${tour.durationText}", color = colors.textMuted, fontSize = 14.sp)
                    }
                    Text(
                        tour.title,
                        color = colors.text,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                        StarRating(tour.organizer.rating, size = 16.dp)
                        Text(
                            " ${tour.organizer.rating} (${tour.organizer.reviewCount} отзывов)",
                            color = colors.textSecondary,
                            fontSize = 14.sp,
                        )
                    }

                    // Organizer
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = colors.surfaceSecondary,
                        modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
                    ) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(
                                model = tour.organizer.avatar,
                                contentDescription = tour.organizer.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.size(44.dp).clip(CircleShape),
                            )
                            Column(Modifier.padding(start = 10.dp).weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(tour.organizer.name, color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                    if (tour.organizer.verified) {
                                        Icon(Icons.Filled.CheckCircle, null, tint = colors.teal, modifier = Modifier.padding(start = 4.dp).size(14.dp))
                                    }
                                }
                                Text("${tour.organizer.toursCount} экскурсий", color = colors.textMuted, fontSize = 12.sp)
                            }
                        }
                    }

                    Text("Описание", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 18.dp, bottom = 6.dp))
                    Text(tour.description, color = colors.textSecondary, fontSize = 14.sp, lineHeight = 21.sp)

                    if (tour.highlights.isNotEmpty()) {
                        Text("Что вас ждёт", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 18.dp, bottom = 6.dp))
                        tour.highlights.forEach { InfoBullet(it, colors.teal) }
                    }
                    if (tour.includes.isNotEmpty()) {
                        Text("Включено", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 18.dp, bottom = 6.dp))
                        tour.includes.forEach { InfoBullet(it, colors.green) }
                    }

                    Row(modifier = Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetaChip(Icons.Filled.Schedule, tour.schedule.ifBlank { "По расписанию" })
                    }
                    Row(modifier = Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetaChip(Icons.Filled.Group, tour.groupSize.ifBlank { "Группа" })
                    }
                    tour.meetingPoint?.let {
                        Row(modifier = Modifier.padding(top = 10.dp)) {
                            MetaChip(Icons.Filled.LocationOn, it)
                        }
                    }

                    if (tour.reviews.isNotEmpty()) {
                        Text("Отзывы", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 20.dp, bottom = 8.dp))
                        tour.reviews.forEach { ReviewCard(it) }
                    }

                    Spacer(Modifier.height(100.dp))
                }
            }
        }

        // Top bar buttons
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 44.dp, start = 12.dp, end = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            CircleButton(Icons.AutoMirrored.Filled.ArrowBack, onBack)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircleButton(if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder, onToggleFavorite, tint = if (isFavorite) colors.coral else Color.White)
                CircleButton(Icons.Filled.Share, {})
            }
        }

        // Bottom booking bar
        Surface(
            color = colors.surface,
            shadowElevation = 12.dp,
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(16.dp).padding(bottom = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    Text("Стоимость", color = colors.textMuted, fontSize = 12.sp)
                    Text("${tour.price}${tour.currency}", color = colors.teal, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                }
                Button(
                    onClick = {},
                    colors = ButtonDefaults.buttonColors(containerColor = colors.teal),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Text("Забронировать", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
            }
        }
    }
}

@Composable
private fun InfoBullet(text: String, dotColor: Color) {
    val colors = LocalYaVoyColors.current
    Row(Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(6.dp).clip(CircleShape).background(dotColor))
        Text(text, color = colors.textSecondary, fontSize = 14.sp, modifier = Modifier.padding(start = 10.dp))
    }
}

@Composable
private fun MetaChip(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    val colors = LocalYaVoyColors.current
    Surface(shape = RoundedCornerShape(10.dp), color = colors.surfaceSecondary) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = colors.teal, modifier = Modifier.size(15.dp))
            Text(" $text", color = colors.textSecondary, fontSize = 13.sp)
        }
    }
}

@Composable
private fun ReviewCard(review: TourReview) {
    val colors = LocalYaVoyColors.current
    Surface(shape = RoundedCornerShape(12.dp), color = colors.surfaceSecondary, modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = review.avatar, contentDescription = review.author, contentScale = ContentScale.Crop, modifier = Modifier.size(36.dp).clip(CircleShape))
                Column(Modifier.padding(start = 10.dp).weight(1f)) {
                    Text(review.author, color = colors.text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(review.date, color = colors.textMuted, fontSize = 11.sp)
                }
                StarRating(review.rating.toDouble(), size = 12.dp)
            }
            Text(review.text, color = colors.textSecondary, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun CircleButton(icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit, tint: Color = Color.White) {
    Surface(onClick = onClick, shape = CircleShape, color = Color(0x66000000), modifier = Modifier.size(40.dp)) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
        }
    }
}

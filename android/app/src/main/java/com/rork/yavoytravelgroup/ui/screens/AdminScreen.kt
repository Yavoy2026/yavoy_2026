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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.yavoytravelgroup.network.UserProfile
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

/**
 * Admin panel: shows the current admin and key moderation stats.
 * User role management is backed by the yavay.ru backend.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    currentUser: UserProfile?,
    onBack: () -> Unit,
) {
    val colors = LocalYaVoyColors.current
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Панель администратора", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад", tint = colors.text)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.surface,
                    titleContentColor = colors.text,
                ),
            )
        },
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Surface(color = colors.surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Вы вошли как", color = colors.textMuted, fontSize = 12.sp)
                        Text(currentUser?.email ?: "—", color = colors.text, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Surface(shape = RoundedCornerShape(8.dp), color = colors.gold.copy(alpha = 0.15f), modifier = Modifier.padding(top = 6.dp)) {
                            Text(
                                (currentUser?.role ?: "user").uppercase(),
                                color = colors.gold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            )
                        }
                    }
                }
            }

            item { Text("Сводка", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold) }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Туры на модерации", "3", colors.orange, Modifier.weight(1f))
                    StatCard("Reels на модерации", "2", colors.coral, Modifier.weight(1f))
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Партнёры на проверке", "1", colors.teal, Modifier.weight(1f))
                    StatCard("Ответы на отзывы", "4", colors.gold, Modifier.weight(1f))
                }
            }

            item { Text("Очередь модерации туров", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp)) }

            items(pendingTours) { item ->
                Surface(color = colors.surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.first, color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                            Text(item.second, color = colors.textMuted, fontSize = 12.sp)
                        }
                        Surface(shape = RoundedCornerShape(8.dp), color = colors.orange.copy(alpha = 0.15f)) {
                            Text("На модерации", color = colors.orange, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

private val pendingTours = listOf(
    "Гастротур по Сочи" to "Партнёр: ВкусЮга · 4500₽",
    "Ночной Калининград" to "Партнёр: Янтарный Гид · 2800₽",
    "Этнотур в Карелию" to "Партнёр: СеверТур · 12000₽",
)

@Composable
private fun StatCard(label: String, value: String, accent: Color, modifier: Modifier = Modifier) {
    val colors = LocalYaVoyColors.current
    Surface(color = colors.surface, shape = RoundedCornerShape(14.dp), modifier = modifier) {
        Column(Modifier.padding(14.dp)) {
            Text(value, color = accent, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
            Text(label, color = colors.textMuted, fontSize = 12.sp)
        }
    }
}

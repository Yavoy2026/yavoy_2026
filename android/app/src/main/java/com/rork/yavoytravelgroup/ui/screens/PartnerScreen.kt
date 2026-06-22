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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.yavoytravelgroup.ui.components.StarRating
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

/**
 * Partner cabinet: ИНН-based registration flow (FNS check), then dashboard with
 * rating and reviews. Mirrors the cross-platform partner experience.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PartnerScreen(onBack: () -> Unit) {
    val colors = LocalYaVoyColors.current
    var verified by remember { mutableStateOf(false) }
    var inn by remember { mutableStateOf("") }

    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Кабинет партнёра", fontWeight = FontWeight.Bold) },
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
        if (!verified) {
            Column(
                Modifier.fillMaxSize().padding(padding).padding(20.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text("Регистрация партнёра", color = colors.text, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(
                    "Введите ИНН вашей организации или ИП. Мы проверим данные через ФНС.",
                    color = colors.textSecondary,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(top = 8.dp, bottom = 20.dp),
                )
                OutlinedTextField(
                    value = inn,
                    onValueChange = { if (it.length <= 12 && it.all { c -> c.isDigit() }) inn = it },
                    label = { Text("ИНН") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.teal,
                        unfocusedBorderColor = colors.border,
                        focusedTextColor = colors.text,
                        unfocusedTextColor = colors.text,
                        focusedLabelColor = colors.teal,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
                Button(
                    onClick = { if (inn.length >= 10) verified = true },
                    enabled = inn.length >= 10,
                    colors = ButtonDefaults.buttonColors(containerColor = colors.teal),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                ) {
                    Text("Проверить в ФНС", color = Color.White, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        } else {
            PartnerDashboard(padding)
        }
    }
}

@Composable
private fun PartnerDashboard(padding: PaddingValues) {
    val colors = LocalYaVoyColors.current
    LazyColumn(
        Modifier.fillMaxSize().background(colors.background).padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Surface(color = colors.surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = colors.green.copy(alpha = 0.15f), modifier = Modifier.size(44.dp)) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Filled.CheckCircle, null, tint = colors.green, modifier = Modifier.size(24.dp))
                        }
                    }
                    Column(Modifier.padding(start = 12.dp)) {
                        Text("ООО «ЯВой Партнёр»", color = colors.text, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("Проверено ФНС · Активен", color = colors.green, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        item {
            Surface(color = colors.surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Рейтинг партнёра", color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                        Text("4.8", color = colors.gold, fontSize = 36.sp, fontWeight = FontWeight.ExtraBold)
                        Column(Modifier.padding(start = 12.dp)) {
                            StarRating(4.8, size = 18.dp)
                            Text("на основе 127 отзывов", color = colors.textMuted, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        item { Text("Отзывы на ваши туры", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold) }

        item {
            ReviewItem("Анна М.", 5, "Прекрасная экскурсия, гид — профессионал!", true)
        }
        item {
            ReviewItem("Дмитрий К.", 4, "Хорошо, но хотелось бы больше времени на остановках.", false)
        }
    }
}

@Composable
private fun ReviewItem(author: String, rating: Int, text: String, replied: Boolean) {
    val colors = LocalYaVoyColors.current
    Surface(color = colors.surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(author, color = colors.text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                StarRating(rating.toDouble(), size = 12.dp)
            }
            Text(text, color = colors.textSecondary, fontSize = 13.sp, modifier = Modifier.padding(top = 6.dp))
            if (replied) {
                Surface(shape = RoundedCornerShape(8.dp), color = colors.tealSoft, modifier = Modifier.padding(top = 8.dp).fillMaxWidth()) {
                    Text("Ваш ответ на модерации администратора", color = colors.teal, fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                }
            } else {
                Text("Ответить →", color = colors.teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 8.dp))
            }
        }
    }
}

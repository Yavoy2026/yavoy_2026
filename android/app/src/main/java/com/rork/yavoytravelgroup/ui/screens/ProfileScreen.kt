package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.SettingsBrightness
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.MockData
import com.rork.yavoytravelgroup.network.UserProfile
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors
import com.rork.yavoytravelgroup.ui.theme.ThemeMode

@Composable
fun ProfileScreen(
    user: UserProfile?,
    photoUrlProvider: (String) -> String,
    favoriteCount: Int,
    loyaltyPoints: Int,
    themeMode: ThemeMode,
    onSetTheme: (ThemeMode) -> Unit,
    onLogin: () -> Unit,
    onLogout: () -> Unit,
    onOpenAdmin: () -> Unit,
    onOpenPartner: () -> Unit,
    onTourClick: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val colors = LocalYaVoyColors.current
    val isAuth = user != null && user.is_active
    var expanded by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier.background(colors.background),
        contentPadding = PaddingValues(bottom = contentPadding.calculateBottomPadding() + 24.dp),
    ) {
        item {
            // Profile header card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.headerBg)
                    .padding(top = contentPadding.calculateTopPadding() + 16.dp, bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box {
                    val avatar = user?.photo?.let { photoUrlProvider(it) }
                        ?: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                    AsyncImage(
                        model = avatar,
                        contentDescription = "Аватар",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(88.dp).clip(CircleShape),
                    )
                }
                Text(
                    text = if (isAuth) "${user.first_name} ${user.last_name ?: ""}".trim().ifBlank { "Пользователь" } else "Гость",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 12.dp),
                )
                Text(
                    text = if (isAuth) user.email else "Войдите, чтобы открыть все возможности",
                    color = colors.textMuted,
                    fontSize = 13.sp,
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 16.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.navyLight)
                        .padding(vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    StatItem("${MockData.purchasedTours.size}", "Поездки", colors.tealLight)
                    StatItem("$loyaltyPoints", "Баллы", colors.gold)
                    StatItem("$favoriteCount", "Избранное", colors.tealLight)
                }
            }
        }

        // Theme selector
        item {
            Surface(
                color = colors.surface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth().padding(16.dp),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text("Тема оформления", color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(bottom = 10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ThemeOption("Системная", Icons.Filled.SettingsBrightness, themeMode == ThemeMode.SYSTEM) { onSetTheme(ThemeMode.SYSTEM) }
                        ThemeOption("Светлая", Icons.Filled.LightMode, themeMode == ThemeMode.LIGHT) { onSetTheme(ThemeMode.LIGHT) }
                        ThemeOption("Тёмная", Icons.Filled.DarkMode, themeMode == ThemeMode.DARK) { onSetTheme(ThemeMode.DARK) }
                    }
                }
            }
        }

        // Sections
        item {
            Surface(color = colors.surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                Column {
                    ExpandableSection("Мои поездки", "${MockData.purchasedTours.size} поездок", Icons.Filled.Flight, colors.teal, expanded == "trips") {
                        expanded = if (expanded == "trips") null else "trips"
                    }
                    AnimatedVisibility(visible = expanded == "trips") {
                        Column(Modifier.background(colors.surfaceSecondary).padding(8.dp)) {
                            MockData.purchasedTours.forEach { pt ->
                                MiniTourRow(pt.tour.image, pt.tour.title, "${pt.tourDate} · ${pt.confirmationCode}") { onTourClick(pt.tour.id) }
                            }
                        }
                    }
                    ExpandableSection("Избранные туры", "$favoriteCount экскурсий", Icons.Filled.Favorite, colors.coral, expanded == "fav") {
                        expanded = if (expanded == "fav") null else "fav"
                    }
                    ExpandableSection("Сертификаты", "Подарочные сертификаты", Icons.Filled.CardGiftcard, colors.gold, expanded == "cert") {
                        expanded = if (expanded == "cert") null else "cert"
                    }
                    ExpandableSection("Транзакции", "${MockData.transactions.size} операций", Icons.Filled.Receipt, colors.orange, expanded == "tx") {
                        expanded = if (expanded == "tx") null else "tx"
                    }
                    AnimatedVisibility(visible = expanded == "tx") {
                        Column(Modifier.background(colors.surfaceSecondary).padding(8.dp)) {
                            MockData.transactions.forEach { tx ->
                                Row(Modifier.fillMaxWidth().padding(8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(tx.tourTitle, color = colors.text, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                    Text(
                                        "${if (tx.status == "refunded") "+" else "-"}${tx.amount}${tx.currency}",
                                        color = if (tx.status == "refunded") colors.red else colors.text,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Partner & Admin access
        item {
            Surface(color = colors.surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                Column {
                    MenuRow("Кабинет партнёра", Icons.Filled.Storefront, colors.teal, onOpenPartner)
                    if (user?.role == "admin" || user?.role == "moderator") {
                        MenuRow("Панель администратора", Icons.Filled.AdminPanelSettings, colors.gold, onOpenAdmin)
                    }
                }
            }
        }

        // Auth button
        item {
            Box(Modifier.padding(16.dp)) {
                if (isAuth) {
                    Button(
                        onClick = onLogout,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.red.copy(alpha = 0.12f)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Logout, null, tint = colors.red)
                        Text("  Выйти", color = colors.red, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Button(
                        onClick = onLogin,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.teal),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Login, null, tint = Color.White)
                        Text("  Войти", color = Color.White, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(value: String, label: String, valueColor: Color) {
    val colors = LocalYaVoyColors.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = valueColor, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
        Text(label, color = colors.textMuted, fontSize = 12.sp)
    }
}

@Composable
private fun ThemeOption(label: String, icon: ImageVector, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) colors.tealSoft else colors.surfaceSecondary,
        modifier = Modifier,
    ) {
        Column(
            Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(icon, null, tint = if (selected) colors.teal else colors.textMuted, modifier = Modifier.size(20.dp))
            Text(label, color = if (selected) colors.teal else colors.textMuted, fontSize = 11.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
private fun ExpandableSection(title: String, subtitle: String, icon: ImageVector, iconColor: Color, expanded: Boolean, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Row(
        modifier = Modifier.fillMaxWidth().background(colors.surface).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(shape = RoundedCornerShape(10.dp), color = iconColor.copy(alpha = 0.12f)) {
            Icon(icon, null, tint = iconColor, modifier = Modifier.padding(8.dp).size(20.dp))
        }
        Column(Modifier.padding(start = 12.dp).weight(1f)) {
            Text(title, color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            Text(subtitle, color = colors.textMuted, fontSize = 12.sp)
        }
        Icon(
            if (expanded) Icons.Filled.KeyboardArrowDown else Icons.AutoMirrored.Filled.KeyboardArrowRight,
            null, tint = colors.textMuted,
        )
    }
}

@Composable
private fun MenuRow(title: String, icon: ImageVector, iconColor: Color, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Row(
        modifier = Modifier.fillMaxWidth().background(colors.surface).padding(14.dp).clip(RoundedCornerShape(0.dp)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(shape = RoundedCornerShape(10.dp), color = iconColor.copy(alpha = 0.12f)) {
            Icon(icon, null, tint = iconColor, modifier = Modifier.padding(8.dp).size(20.dp))
        }
        Text(title, color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 12.dp).weight(1f))
        Surface(onClick = onClick, color = Color.Transparent) {
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = colors.textMuted)
        }
    }.also {
        // make full row clickable
    }
}

@Composable
private fun MiniTourRow(image: String, title: String, sub: String, onClick: () -> Unit) {
    val colors = LocalYaVoyColors.current
    Surface(onClick = onClick, color = colors.surface, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(model = image, contentDescription = title, contentScale = ContentScale.Crop, modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp)))
            Column(Modifier.padding(start = 10.dp)) {
                Text(title, color = colors.text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(sub, color = colors.textMuted, fontSize = 11.sp)
            }
        }
    }
}

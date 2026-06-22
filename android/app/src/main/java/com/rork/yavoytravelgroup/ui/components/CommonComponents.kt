package com.rork.yavoytravelgroup.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    val colors = LocalYaVoyColors.current
    Text(
        text = text,
        color = colors.text,
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold,
        modifier = modifier.padding(start = 16.dp, top = 18.dp, bottom = 10.dp),
    )
}

@Composable
fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = LocalYaVoyColors.current
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = if (selected) colors.teal else colors.surface,
        modifier = modifier.border(
            width = 1.dp,
            color = if (selected) colors.teal else colors.border,
            shape = RoundedCornerShape(10.dp),
        ),
    ) {
        Text(
            text = label,
            color = if (selected) Color.White else colors.textSecondary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
        )
    }
}

@Composable
fun AdvantagesBlock(modifier: Modifier = Modifier) {
    val colors = LocalYaVoyColors.current
    val items = listOf(
        Triple(Icons.Filled.Verified, "Проверенные гиды", "Рейтинговая система и модерация"),
        Triple(Icons.Filled.CheckCircle, "Мгновенное бронирование", "Подтверждение за секунды"),
        Triple(Icons.Filled.CreditCard, "Безопасная оплата", "Защищённые платежи"),
        Triple(Icons.Filled.SupportAgent, "Поддержка 24/7", "Всегда на связи"),
    )
    Column(modifier = modifier.fillMaxWidth().padding(16.dp)) {
        Text("Почему YaVoy?", color = colors.text, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
        items.forEach { (icon, title, sub) ->
            AdvantageRow(icon, title, sub)
        }
    }
}

@Composable
private fun AdvantageRow(icon: ImageVector, title: String, sub: String) {
    val colors = LocalYaVoyColors.current
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = colors.surface,
        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(shape = RoundedCornerShape(10.dp), color = colors.tealSoft) {
                Icon(icon, null, tint = colors.teal, modifier = Modifier.padding(8.dp).size(22.dp))
            }
            Column {
                Text(title, color = colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(sub, color = colors.textMuted, fontSize = 13.sp)
            }
        }
    }
}

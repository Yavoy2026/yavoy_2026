package com.rork.yavoytravelgroup.ui.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarHalf
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors
import kotlin.math.floor

@Composable
fun StarRating(
    rating: Double,
    modifier: Modifier = Modifier,
    size: Dp = 14.dp,
) {
    val colors = LocalYaVoyColors.current
    val full = floor(rating).toInt()
    val hasHalf = rating - full >= 0.5
    Row(modifier = modifier) {
        for (i in 1..5) {
            val icon = when {
                i <= full -> Icons.Filled.Star
                i == full + 1 && hasHalf -> Icons.Filled.StarHalf
                else -> Icons.Outlined.StarOutline
            }
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = colors.gold,
                modifier = Modifier.size(size),
            )
        }
    }
}

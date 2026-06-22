package com.rork.yavoytravelgroup.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

enum class ThemeMode { SYSTEM, LIGHT, DARK }

@Composable
fun AppTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    val systemDark = isSystemInDarkTheme()
    val isDark = when (themeMode) {
        ThemeMode.SYSTEM -> systemDark
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    val yavoy = if (isDark) DarkYaVoyColors else LightYaVoyColors

    val colorScheme = if (isDark) {
        darkColorScheme(
            primary = yavoy.teal,
            onPrimary = androidx.compose.ui.graphics.Color.White,
            secondary = yavoy.gold,
            background = yavoy.background,
            surface = yavoy.surface,
            onBackground = yavoy.text,
            onSurface = yavoy.text,
            error = yavoy.red,
        )
    } else {
        lightColorScheme(
            primary = yavoy.teal,
            onPrimary = androidx.compose.ui.graphics.Color.White,
            secondary = yavoy.gold,
            background = yavoy.background,
            surface = yavoy.surface,
            onBackground = yavoy.text,
            onSurface = yavoy.text,
            error = yavoy.red,
        )
    }

    CompositionLocalProvider(LocalYaVoyColors provides yavoy) {
        MaterialTheme(
            colorScheme = colorScheme,
            content = content
        )
    }
}

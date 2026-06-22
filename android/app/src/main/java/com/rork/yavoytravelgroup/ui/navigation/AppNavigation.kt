package com.rork.yavoytravelgroup.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rork.yavoytravelgroup.ui.AppViewModel
import com.rork.yavoytravelgroup.ui.AuthViewModel
import com.rork.yavoytravelgroup.ui.screens.AdminScreen
import com.rork.yavoytravelgroup.ui.screens.AuthScreen
import com.rork.yavoytravelgroup.ui.screens.ExploreScreen
import com.rork.yavoytravelgroup.ui.screens.FavoritesScreen
import com.rork.yavoytravelgroup.ui.screens.HomeScreen
import com.rork.yavoytravelgroup.ui.screens.PartnerScreen
import com.rork.yavoytravelgroup.ui.screens.ProfileScreen
import com.rork.yavoytravelgroup.ui.screens.ReelsScreen
import com.rork.yavoytravelgroup.ui.screens.TourDetailScreen
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

private data class TabItem(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    TabItem("home", "Экскурсии", Icons.Filled.Explore),
    TabItem("explore", "Направления", Icons.Filled.Map),
    TabItem("favorites", "Избранное", Icons.Filled.Favorite),
    TabItem("profile", "Профиль", Icons.Filled.Person),
)

@Composable
fun AppNavigation(
    appViewModel: AppViewModel,
    authViewModel: AuthViewModel,
) {
    val colors = LocalYaVoyColors.current
    val navController = rememberNavController()
    val appState by appViewModel.uiState.collectAsStateWithLifecycle()
    val authState by authViewModel.state.collectAsStateWithLifecycle()

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute in tabs.map { it.route }

    Scaffold(
        containerColor = colors.background,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = colors.surface) {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                if (currentRoute != tab.route) {
                                    navController.navigate(tab.route) {
                                        popUpTo("home") { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label, fontSize = androidx.compose.ui.unit.TextUnit.Unspecified) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = colors.teal,
                                selectedTextColor = colors.teal,
                                unselectedIconColor = colors.textMuted,
                                unselectedTextColor = colors.textMuted,
                                indicatorColor = colors.tealSoft,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier,
        ) {
            composable("home") {
                HomeScreen(
                    favoriteIds = appState.favoriteTourIds,
                    reelsCount = appState.reels.size,
                    onTourClick = { navController.navigate("tour/$it") },
                    onToggleFavorite = appViewModel::toggleFavoriteTour,
                    onOpenReels = { navController.navigate("reels") },
                    contentPadding = padding,
                )
            }
            composable("explore") {
                ExploreScreen(
                    onCityClick = { navController.navigate("home") },
                    onTourClick = { navController.navigate("tour/$it") },
                    contentPadding = padding,
                )
            }
            composable("favorites") {
                FavoritesScreen(
                    favoriteTourIds = appState.favoriteTourIds,
                    favoriteCityIds = appState.favoriteCityIds,
                    onTourClick = { navController.navigate("tour/$it") },
                    onToggleFavorite = appViewModel::toggleFavoriteTour,
                    onToggleFavoriteCity = appViewModel::toggleFavoriteCity,
                    onCityClick = { navController.navigate("home") },
                    contentPadding = padding,
                )
            }
            composable("profile") {
                ProfileScreen(
                    user = authState.user,
                    photoUrlProvider = { authViewModel.api.photoUrl(it) },
                    favoriteCount = appState.favoriteTourIds.size,
                    loyaltyPoints = appState.loyaltyPoints,
                    themeMode = appState.themeMode,
                    onSetTheme = appViewModel::setTheme,
                    onLogin = { navController.navigate("auth") },
                    onLogout = { authViewModel.logout() },
                    onOpenAdmin = { navController.navigate("admin") },
                    onOpenPartner = { navController.navigate("partner") },
                    onTourClick = { navController.navigate("tour/$it") },
                    contentPadding = padding,
                )
            }
            composable(
                route = "tour/{tourId}",
                arguments = listOf(navArgument("tourId") { type = NavType.StringType }),
            ) { entry ->
                val tourId = entry.arguments?.getString("tourId") ?: ""
                TourDetailScreen(
                    tourId = tourId,
                    isFavorite = tourId in appState.favoriteTourIds,
                    onBack = { navController.popBackStack() },
                    onToggleFavorite = { appViewModel.toggleFavoriteTour(tourId) },
                )
            }
            composable("reels") {
                ReelsScreen(
                    reels = appState.reels,
                    onToggleLike = appViewModel::toggleReelLike,
                    onClose = { navController.popBackStack() },
                )
            }
            composable("auth") {
                AuthScreen(
                    authViewModel = authViewModel,
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() },
                )
            }
            composable("admin") {
                AdminScreen(currentUser = authState.user, onBack = { navController.popBackStack() })
            }
            composable("partner") {
                PartnerScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}

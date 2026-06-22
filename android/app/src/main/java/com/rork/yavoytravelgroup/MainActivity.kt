package com.rork.yavoytravelgroup

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rork.yavoytravelgroup.ui.AppViewModel
import com.rork.yavoytravelgroup.ui.AuthViewModel
import com.rork.yavoytravelgroup.ui.navigation.AppNavigation
import com.rork.yavoytravelgroup.ui.theme.AppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val appViewModel: AppViewModel = viewModel()
            val authViewModel: AuthViewModel = viewModel()
            val appState by appViewModel.uiState.collectAsStateWithLifecycle()

            AppTheme(themeMode = appState.themeMode) {
                AppNavigation(appViewModel = appViewModel, authViewModel = authViewModel)
            }
        }
    }
}

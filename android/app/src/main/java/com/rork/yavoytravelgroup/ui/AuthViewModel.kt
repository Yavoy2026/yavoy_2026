package com.rork.yavoytravelgroup.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rork.yavoytravelgroup.network.ApiException
import com.rork.yavoytravelgroup.network.ApiService
import com.rork.yavoytravelgroup.network.TokenStore
import com.rork.yavoytravelgroup.network.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthState(
    val user: UserProfile? = null,
    val isLoading: Boolean = true,
) {
    val isAuthenticated: Boolean get() = user != null && user.is_active
    val role: String? get() = user?.role
}

/** Manages authentication against the yavay.ru backend. */
class AuthViewModel(app: Application) : AndroidViewModel(app) {

    private val tokenStore = TokenStore(app)
    val api = ApiService(tokenStore)

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init {
        checkAuth()
    }

    private fun checkAuth() {
        viewModelScope.launch {
            if (!tokenStore.hasSession) {
                _state.value = AuthState(user = null, isLoading = false)
                return@launch
            }
            try {
                val profile = api.whoami()
                _state.value = AuthState(user = profile, isLoading = false)
            } catch (_: Exception) {
                _state.value = AuthState(user = null, isLoading = false)
            }
        }
    }

    fun login(email: String, password: String, onResult: (Result<UserProfile>) -> Unit) {
        viewModelScope.launch {
            try {
                api.signin(email, password)
                val profile = api.whoami()
                _state.value = _state.value.copy(user = profile, isLoading = false)
                onResult(Result.success(profile))
            } catch (e: Exception) {
                onResult(Result.failure(e))
            }
        }
    }

    fun register(email: String, password: String, firstName: String, onResult: (Result<UserProfile>) -> Unit) {
        viewModelScope.launch {
            try {
                api.signup(email, password, firstName)
                val profile = api.whoami()
                _state.value = _state.value.copy(user = profile, isLoading = false)
                onResult(Result.success(profile))
            } catch (e: Exception) {
                onResult(Result.failure(e))
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                api.logout()
            } catch (_: Exception) {
            }
            _state.value = AuthState(user = null, isLoading = false)
        }
    }

    fun refreshUser() {
        viewModelScope.launch {
            try {
                val profile = api.whoami()
                _state.value = _state.value.copy(user = profile)
            } catch (_: Exception) {
            }
        }
    }

    companion object {
        fun friendlyError(e: Throwable): String {
            val msg = (e as? ApiException)?.message ?: e.message ?: "Ошибка. Попробуйте позже."
            return when {
                msg.contains("Wrong", true) || msg.contains("password", true) -> "Неверный email или пароль"
                msg.contains("Inactive", true) -> "Аккаунт деактивирован. Обратитесь к администратору."
                msg.contains("exist", true) -> "Пользователь с таким email уже существует"
                else -> msg
            }
        }
    }
}

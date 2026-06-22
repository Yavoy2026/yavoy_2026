package com.rork.yavoytravelgroup.network

import android.content.Context
import androidx.core.content.edit

/** Persists auth tokens in SharedPreferences. */
class TokenStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("yavoy_auth", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        private set(value) = prefs.edit { putString(KEY_ACCESS, value) }

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        private set(value) = prefs.edit { putString(KEY_REFRESH, value) }

    fun save(tokens: Tokens) {
        prefs.edit {
            putString(KEY_ACCESS, tokens.access_token)
            putString(KEY_REFRESH, tokens.refresh_token)
        }
    }

    fun clear() {
        prefs.edit { clear() }
    }

    val hasSession: Boolean get() = !accessToken.isNullOrEmpty()

    companion object {
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
    }
}

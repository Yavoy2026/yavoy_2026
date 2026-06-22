package com.rork.yavoytravelgroup.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * Networking layer for the yavay.ru backend. Handles bearer auth and automatic
 * token refresh on 401, mirroring the React Native / web api clients.
 */
class ApiService(private val tokenStore: TokenStore) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val client = HttpClient(Android) {
        install(ContentNegotiation) { json(json) }
        expectSuccess = false
    }

    private suspend fun errorMessage(response: HttpResponse, fallback: String): String {
        return try {
            val body = response.body<ApiErrorBody>()
            body.detail ?: fallback
        } catch (_: Exception) {
            fallback
        }
    }

    // ─── Auth ──────────────────────────────────────────────

    suspend fun signin(email: String, password: String): Tokens {
        val response = client.post("$BASE/auth/signin") {
            contentType(ContentType.Application.Json)
            setBody(SigninPayload(email, password))
        }
        if (!response.status.isSuccess()) {
            throw ApiException(response.status.value, errorMessage(response, "Ошибка входа"))
        }
        val tokens = response.body<Tokens>()
        tokenStore.save(tokens)
        return tokens
    }

    suspend fun signup(email: String, password: String, firstName: String): Tokens {
        val response = client.post("$BASE/auth/signup") {
            contentType(ContentType.Application.Json)
            setBody(SignupPayload(email, password, firstName))
        }
        if (!response.status.isSuccess()) {
            throw ApiException(response.status.value, errorMessage(response, "Ошибка регистрации"))
        }
        val tokens = response.body<Tokens>()
        tokenStore.save(tokens)
        return tokens
    }

    suspend fun whoami(): UserProfile = authGet("$BASE/auth/whoami", "Не авторизован")

    suspend fun logout() {
        val refresh = tokenStore.refreshToken
        if (!refresh.isNullOrEmpty()) {
            try {
                client.get("$BASE/auth/logout?refresh_token=$refresh")
            } catch (_: Exception) {
                // ignore network errors during logout
            }
        }
        tokenStore.clear()
    }

    // ─── Users ─────────────────────────────────────────────

    suspend fun updateProfile(userId: String, firstName: String?, lastName: String?): UserProfile {
        val response = authRequest {
            client.patch("$BASE/users/$userId") {
                authHeader()
                contentType(ContentType.Application.Json)
                setBody(UpdateProfilePayload(firstName, lastName))
            }
        }
        if (!response.status.isSuccess()) {
            throw ApiException(response.status.value, errorMessage(response, "Ошибка обновления профиля"))
        }
        return response.body()
    }

    suspend fun updateRole(userId: String, role: String): UserProfile {
        val response = authRequest {
            client.patch("$BASE/users/$userId/update-role") {
                authHeader()
                contentType(ContentType.Application.Json)
                setBody(UpdateRolePayload(role))
            }
        }
        if (!response.status.isSuccess()) {
            throw ApiException(response.status.value, errorMessage(response, "Ошибка изменения роли"))
        }
        return response.body()
    }

    fun photoUrl(filename: String): String = "$BASE/users/photo/$filename"

    // ─── Helpers ───────────────────────────────────────────

    private suspend inline fun <reified T> authGet(url: String, fallbackError: String): T {
        val response = authRequest {
            client.get(url) { authHeader() }
        }
        if (!response.status.isSuccess()) {
            throw ApiException(response.status.value, errorMessage(response, fallbackError))
        }
        return response.body()
    }

    private fun io.ktor.client.request.HttpRequestBuilder.authHeader() {
        tokenStore.accessToken?.let { header("Authorization", "Bearer $it") }
    }

    /** Runs a request and retries once after refreshing tokens on a 401. */
    private suspend fun authRequest(block: suspend () -> HttpResponse): HttpResponse {
        var response = block()
        if (response.status == HttpStatusCode.Unauthorized && !tokenStore.refreshToken.isNullOrEmpty()) {
            if (refreshTokens()) {
                response = block()
            }
        }
        return response
    }

    private suspend fun refreshTokens(): Boolean {
        val refresh = tokenStore.refreshToken ?: return false
        return try {
            val response = client.get("$BASE/auth/refresh?refresh_token=$refresh")
            if (response.status.isSuccess()) {
                tokenStore.save(response.body())
                true
            } else {
                tokenStore.clear()
                false
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun HttpStatusCode.isSuccess(): Boolean = value in 200..299

    companion object {
        const val BASE = "https://yavay.ru/backend/api/v1"
    }
}

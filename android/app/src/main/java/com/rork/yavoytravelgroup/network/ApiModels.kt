package com.rork.yavoytravelgroup.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** DTOs for the yavay.ru backend (auth + users). */

@Serializable
data class Tokens(
    val access_token: String,
    val refresh_token: String,
    val expires_refresh: String? = null,
)

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    val is_active: Boolean = true,
    val role: String = "user", // admin | user | moderator
    val first_name: String = "",
    val last_name: String? = null,
    val photo: String? = null,
    val photo_min: String? = null,
    val created_at: String? = null,
    val last_login: String? = null,
)

@Serializable
data class SigninPayload(
    val email: String,
    val password: String,
)

@Serializable
data class SignupPayload(
    val email: String,
    val password: String,
    val first_name: String,
)

@Serializable
data class UpdateProfilePayload(
    val first_name: String? = null,
    val last_name: String? = null,
)

@Serializable
data class UpdateRolePayload(
    val role: String,
)

@Serializable
data class ApiErrorBody(
    @SerialName("detail") val detail: String? = null,
)

class ApiException(val status: Int, message: String) : Exception(message)

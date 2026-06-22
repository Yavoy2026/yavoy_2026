package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.yavoytravelgroup.ui.AuthViewModel
import com.rork.yavoytravelgroup.ui.theme.LocalYaVoyColors

@Composable
fun AuthScreen(
    authViewModel: AuthViewModel,
    onBack: () -> Unit,
    onSuccess: () -> Unit,
) {
    val colors = LocalYaVoyColors.current
    var isRegister by remember { mutableStateOf(false) }
    var firstName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    fun submit() {
        error = ""
        if (email.isBlank() || password.isBlank() || (isRegister && firstName.isBlank())) {
            error = "Заполните все поля"
            return
        }
        loading = true
        val callback: (Result<com.rork.yavoytravelgroup.network.UserProfile>) -> Unit = { result ->
            loading = false
            result.fold(
                onSuccess = { onSuccess() },
                onFailure = { error = AuthViewModel.friendlyError(it) },
            )
        }
        if (isRegister) {
            authViewModel.register(email.trim(), password, firstName.trim(), callback)
        } else {
            authViewModel.login(email.trim(), password, callback)
        }
    }

    Box(Modifier.fillMaxSize().background(colors.background)) {
        Surface(
            onClick = onBack,
            shape = CircleShape,
            color = colors.surfaceSecondary,
            modifier = Modifier.align(Alignment.TopStart).padding(top = 48.dp, start = 16.dp).size(40.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад", tint = colors.text, modifier = Modifier.size(22.dp))
            }
        }

        Column(
            Modifier.fillMaxSize().padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = CircleShape, color = colors.teal, modifier = Modifier.size(72.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Text("YV", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                }
            }
            Text(
                if (isRegister) "Создать аккаунт" else "С возвращением!",
                color = colors.text,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                if (isRegister) "Зарегистрируйтесь, чтобы начать" else "Войдите, чтобы продолжить путешествия",
                color = colors.textMuted,
                fontSize = 15.sp,
                modifier = Modifier.padding(bottom = 24.dp),
            )

            if (error.isNotBlank()) {
                Surface(shape = RoundedCornerShape(10.dp), color = colors.red.copy(alpha = 0.1f), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    Text(error, color = colors.red, fontSize = 14.sp, modifier = Modifier.padding(12.dp))
                }
            }

            if (isRegister) {
                AuthField(firstName, { firstName = it }, "Имя", KeyboardType.Text)
            }
            AuthField(email, { email = it }, "Email", KeyboardType.Email)
            AuthField(password, { password = it }, "Пароль", KeyboardType.Password, isPassword = true)

            Button(
                onClick = { submit() },
                enabled = !loading,
                colors = ButtonDefaults.buttonColors(containerColor = colors.teal),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            ) {
                if (loading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                } else {
                    Text(if (isRegister) "Зарегистрироваться" else "Войти", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
                }
            }

            Text(
                buildString { append(if (isRegister) "Уже есть аккаунт? Войти" else "Нет аккаунта? Зарегистрироваться") },
                color = colors.teal,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = 16.dp).clickable { isRegister = !isRegister; error = "" },
            )
        }
    }
}

@Composable
private fun AuthField(
    value: String,
    onChange: (String) -> Unit,
    label: String,
    keyboardType: KeyboardType,
    isPassword: Boolean = false,
) {
    val colors = LocalYaVoyColors.current
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = ImeAction.Next),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colors.teal,
            unfocusedBorderColor = colors.border,
            focusedTextColor = colors.text,
            unfocusedTextColor = colors.text,
            focusedLabelColor = colors.teal,
        ),
        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
    )
}



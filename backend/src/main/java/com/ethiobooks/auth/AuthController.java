package com.ethiobooks.auth;

import com.ethiobooks.auth.dto.AuthResponse;
import com.ethiobooks.auth.dto.GoogleAuthRequest;
import com.ethiobooks.auth.dto.LoginRequest;
import com.ethiobooks.auth.dto.PhoneOtpRequest;
import com.ethiobooks.auth.dto.PhoneOtpStatusResponse;
import com.ethiobooks.auth.dto.PhoneOtpVerifyRequest;
import com.ethiobooks.auth.dto.RefreshTokenRequest;
import com.ethiobooks.auth.dto.RegisterRequest;
import com.ethiobooks.auth.dto.RegisterResponse;
import com.ethiobooks.auth.dto.ResendVerificationRequest;
import com.ethiobooks.auth.dto.VerifyEmailRequest;
import com.ethiobooks.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, Google Sign-In, refresh tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register with email and password")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registration successful", authService.register(request));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email from confirmation link")
    public ApiResponse<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.ok("Email verified", authService.verifyEmail(request.getToken()));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification link")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.getEmail());
        return ApiResponse.ok(
                "If an account exists for this email, a verification link was sent.",
                null);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/google")
    @Operation(summary = "Sign in or register with Google ID token")
    public ApiResponse<AuthResponse> google(@Valid @RequestBody GoogleAuthRequest request) {
        return ApiResponse.ok("Google authentication successful", authService.googleAuth(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request));
    }

    @PostMapping("/otp/request")
    @Operation(summary = "Request phone OTP (disabled unless app.otp.phone-enabled=true)")
    public ApiResponse<PhoneOtpStatusResponse> requestOtp(@Valid @RequestBody PhoneOtpRequest request) {
        return ApiResponse.ok("OTP sent", authService.requestPhoneOtp(request));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify phone OTP (disabled unless app.otp.phone-enabled=true)")
    public ApiResponse<AuthResponse> verifyOtp(@Valid @RequestBody PhoneOtpVerifyRequest request) {
        return ApiResponse.ok("Phone authentication successful", authService.verifyPhoneOtp(request));
    }
}

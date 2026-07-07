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
import com.ethiobooks.auth.email.EmailVerificationService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.PaymentMethodService;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.config.OtpProperties;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.util.PhoneUtils;
import com.ethiobooks.otp.OtpService;
import com.ethiobooks.security.JwtProperties;
import com.ethiobooks.security.JwtService;
import com.ethiobooks.security.domain.RefreshToken;
import com.ethiobooks.security.repository.RefreshTokenRepository;
import com.ethiobooks.transactions.CategorySeeder;
import com.ethiobooks.users.domain.AuthProvider;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.mapper.UserMapper;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final CategorySeeder categorySeeder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final GoogleTokenService googleTokenService;
    private final OtpService otpService;
    private final OtpProperties otpProperties;
    private final EmailVerificationService emailVerificationService;
    private final PaymentMethodService paymentMethodService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BusinessException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.OWNER)
                .authProvider(AuthProvider.LOCAL)
                .locale(request.getLocale() != null ? request.getLocale() : "en")
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        onboardBusiness(user, request.getBusinessName(), request.getBusinessType());

        emailVerificationService.sendVerificationForUser(user);

        return RegisterResponse.builder()
                .email(user.getEmail())
                .verificationRequired(true)
                .message("Check your email to verify your account before signing in.")
                .build();
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        User user = emailVerificationService.verifyToken(token);
        return buildAuthResponse(user);
    }

    public void resendVerificationEmail(String email) {
        emailVerificationService.resendVerification(email);
    }

    public PhoneOtpStatusResponse requestPhoneOtp(PhoneOtpRequest request) {
        requirePhoneOtpEnabled();
        String phone = PhoneUtils.normalize(request.getPhone());
        boolean existing = userRepository.findByPhone(phone).isPresent();
        otpService.requestOtp(phone, request.getChannel());
        return new PhoneOtpStatusResponse(existing);
    }

    @Transactional
    public AuthResponse verifyPhoneOtp(PhoneOtpVerifyRequest request) {
        requirePhoneOtpEnabled();
        otpService.verifyOtpOrThrow(request.getPhone(), request.getCode());

        String phone = PhoneUtils.normalize(request.getPhone());
        return userRepository.findByPhone(phone)
                .map(this::buildAuthResponse)
                .orElseGet(() -> registerPhoneUser(phone, request));
    }

    private AuthResponse registerPhoneUser(String phone, PhoneOtpVerifyRequest request) {
        if (!StringUtils.hasText(request.getBusinessName()) || !StringUtils.hasText(request.getFullName())) {
            throw new BusinessException("businessName and fullName are required for new phone accounts");
        }

        String emailBase = "phone-" + phone.replace("+", "");
        String email = emailBase + "@mysuq.local";
        if (userRepository.existsByEmail(email)) {
            email = emailBase + "-" + Instant.now().toEpochMilli() + "@mysuq.local";
        }

        User user = User.builder()
                .email(email)
                .phone(phone)
                .fullName(request.getFullName())
                .authProvider(AuthProvider.PHONE)
                .role(UserRole.OWNER)
                .locale(request.getLocale() != null ? request.getLocale() : "en")
                .emailVerified(true)
                .build();
        user = userRepository.save(user);

        onboardBusiness(user, request.getBusinessName(), request.getBusinessType());
        return buildAuthResponse(user);
    }

    // phone normalization in PhoneUtils

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (!user.isActive()) {
            throw new BusinessException("Your service has been deactivated. Contact support.");
        }

        if (!user.hasPassword()) {
            throw new BusinessException("This account uses Google Sign-In. Please sign in with Google.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        requireEmailVerified(user);

        return buildAuthResponse(user);
    }

    /**
     * Sign in or register with a Google ID token (from Google Sign-In SDK on web/mobile).
     */
    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        GoogleTokenService.GoogleUserInfo googleUser = googleTokenService.verify(request.getIdToken());

        return userRepository.findByGoogleId(googleUser.googleId())
                .map(user -> buildAuthResponse(userRepository.save(syncGoogleProfile(user, googleUser))))
                .orElseGet(() -> handleGoogleUserByEmail(googleUser, request));
    }

    private AuthResponse handleGoogleUserByEmail(
            GoogleTokenService.GoogleUserInfo googleUser,
            GoogleAuthRequest request) {

        return userRepository.findByEmail(googleUser.email())
                .map(existing -> linkGoogleAccount(existing, googleUser))
                .orElseGet(() -> registerGoogleUser(googleUser, request));
    }

    private AuthResponse linkGoogleAccount(User user, GoogleTokenService.GoogleUserInfo googleUser) {
        requireActiveUser(user);
        if (user.getGoogleId() != null && !user.getGoogleId().equals(googleUser.googleId())) {
            throw new BusinessException("Email is linked to a different Google account");
        }
        user.setGoogleId(googleUser.googleId());
        syncGoogleProfile(user, googleUser);
        user.setEmailVerified(true);
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(Instant.now());
        }
        return buildAuthResponse(userRepository.save(user));
    }

    private User syncGoogleProfile(User user, GoogleTokenService.GoogleUserInfo googleUser) {
        if (googleUser.pictureUrl() != null && !googleUser.pictureUrl().isBlank()) {
            user.setProfilePictureUrl(googleUser.pictureUrl().trim());
        }
        if (googleUser.fullName() != null && !googleUser.fullName().isBlank()) {
            user.setFullName(googleUser.fullName().trim());
        }
        return user;
    }

    private AuthResponse registerGoogleUser(
            GoogleTokenService.GoogleUserInfo googleUser,
            GoogleAuthRequest request) {

        if (!StringUtils.hasText(request.getBusinessName())) {
            throw new BusinessException(
                    "businessName is required when creating a new account with Google");
        }

        User user = User.builder()
                .email(googleUser.email())
                .googleId(googleUser.googleId())
                .fullName(StringUtils.hasText(googleUser.fullName())
                        ? googleUser.fullName() : googleUser.email())
                .profilePictureUrl(googleUser.pictureUrl())
                .phone(request.getPhone())
                .authProvider(AuthProvider.GOOGLE)
                .role(UserRole.OWNER)
                .locale(request.getLocale() != null ? request.getLocale() : "en")
                .emailVerified(true)
                .emailVerifiedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        onboardBusiness(user, request.getBusinessName(), request.getBusinessType());

        return buildAuthResponse(user);
    }

    private void onboardBusiness(User user, String businessName, String businessType) {
        Business business = Business.builder()
                .owner(user)
                .name(businessName)
                .businessType(businessType)
                .build();
        business = businessRepository.save(business);
        categorySeeder.seedDefaults(business);
        paymentMethodService.seedDefaults(business);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String hash = hashToken(request.getRefreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("Refresh token expired");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = userRepository.findById(stored.getUser().getId())
                .orElseThrow(() -> new BusinessException("User not found"));
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        requireActiveUser(user);
        requireEmailVerified(user);
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshTokenValue();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(refreshTokenValue))
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs()))
                .build();
        refreshTokenRepository.save(refreshToken);

        var authBuilder = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .expiresIn(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .user(userMapper.toDto(user));

        businessRepository.findByOwnerId(user.getId()).stream().findFirst().ifPresent(b -> {
            authBuilder.businessId(b.getId());
            authBuilder.businessName(b.getName());
            authBuilder.subscriptionPlan(b.getSubscriptionPlan());
            authBuilder.subscriptionActive(b.isSubscriptionActive());
        });

        return authBuilder.build();
    }

    private void requirePhoneOtpEnabled() {
        if (!otpProperties.isPhoneEnabled()) {
            throw new BusinessException(
                    "Phone sign-in is not available. Use Google or email and password.");
        }
    }

    private void requireActiveUser(User user) {
        if (user != null && !user.isActive()) {
            throw new BusinessException("Your service has been deactivated. Contact support.");
        }
    }

    private void requireEmailVerified(User user) {
        if (user == null) {
            return;
        }
        if (user.getAuthProvider() == AuthProvider.LOCAL && !user.isEmailVerified()) {
            throw new BusinessException(
                    "Please verify your email before signing in. Check your inbox or request a new link.");
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new BusinessException("Token hashing failed");
        }
    }
}

package com.ethiobooks.auth.email;

import com.ethiobooks.auth.email.domain.EmailVerificationToken;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.config.AppMailProperties;
import com.ethiobooks.users.domain.AuthProvider;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final int MAX_RESENDS_PER_HOUR = 3;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final MailService mailService;
    private final AppMailProperties mailProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendVerificationForUser(User user) {
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            return;
        }
        if (user.isEmailVerified()) {
            return;
        }
        issueAndSend(user);
    }

    @Transactional
    public void resendVerification(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BusinessException("This account uses Google Sign-In. Please sign in with Google.");
        }
        if (user.isEmailVerified()) {
            throw new BusinessException("This email is already verified. You can sign in.");
        }

        Instant since = Instant.now().minus(1, ChronoUnit.HOURS);
        if (tokenRepository.countRecentByUser(user.getId(), since) >= MAX_RESENDS_PER_HOUR) {
            throw new BusinessException("Too many verification emails. Try again in an hour.");
        }

        issueAndSend(user);
    }

    @Transactional
    public User verifyToken(String rawToken) {
        String token = rawToken == null ? "" : rawToken.trim();
        if (token.isBlank()) {
            throw new BusinessException("Verification link is invalid.");
        }

        String hash = hashToken(token);
        EmailVerificationToken stored = tokenRepository
                .findByTokenHashAndUsedAtIsNull(hash)
                .orElseThrow(() -> new BusinessException("Verification link is invalid or already used."));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("Verification link has expired. Request a new one from the login page.");
        }

        User user = stored.getUser();
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.setEmailVerifiedAt(Instant.now());
            userRepository.save(user);
        }

        stored.setUsedAt(Instant.now());
        tokenRepository.save(stored);
        tokenRepository.invalidateActiveForUser(user.getId(), Instant.now());

        return user;
    }

    private void issueAndSend(User user) {
        String rawToken = generateToken();
        Instant expires = Instant.now().plus(mailProperties.getVerificationTtlHours(), ChronoUnit.HOURS);

        tokenRepository.invalidateActiveForUser(user.getId(), Instant.now());
        tokenRepository.save(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(expires)
                .build());

        String verifyUrl =
                mailProperties.getFrontendUrl().replaceAll("/$", "") + "/verify-email?token=" + rawToken;
        mailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verifyUrl);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
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

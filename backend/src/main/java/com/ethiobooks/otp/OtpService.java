package com.ethiobooks.otp;

import com.ethiobooks.config.OtpProperties;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.util.PhoneUtils;
import com.ethiobooks.otp.domain.PhoneOtp;
import com.ethiobooks.otp.repository.PhoneOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final PhoneOtpRepository phoneOtpRepository;
    private final OtpProperties otpProperties;
    private final TelegramOtpSender telegramOtpSender;
    private final WhatsAppOtpSender whatsAppOtpSender;

    @Transactional
    public void requestOtp(String rawPhone, OtpChannel channel) {
        String phone = PhoneUtils.normalize(rawPhone);
        enforceRateLimit(phone);

        String code = generateCode();
        String hash = hashCode(phone, code);

        PhoneOtp otp = PhoneOtp.builder()
                .phone(phone)
                .codeHash(hash)
                .expiresAt(Instant.now().plus(otpProperties.getTtlSeconds(), ChronoUnit.SECONDS))
                .maxAttempts(otpProperties.getMaxAttempts())
                .sentVia(channel.name())
                .build();
        phoneOtpRepository.save(otp);

        sender(channel).send(phone, code);
    }

    @Transactional
    public void verifyOtpOrThrow(String rawPhone, String code) {
        String phone = PhoneUtils.normalize(rawPhone);
        String trimmed = code == null ? "" : code.trim();
        if (!trimmed.matches("^\\d{4,8}$")) {
            throw new BusinessException("Invalid code");
        }

        List<PhoneOtp> recent = phoneOtpRepository.findTop5ByPhoneOrderByCreatedAtDesc(phone);
        PhoneOtp otp = recent.stream()
                .filter(o -> o.getUsedAt() == null)
                .findFirst()
                .orElseThrow(() -> new BusinessException("Code expired. Request a new code."));

        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("Code expired. Request a new code.");
        }
        if (otp.getAttempts() >= otp.getMaxAttempts()) {
            throw new BusinessException("Too many attempts. Request a new code.");
        }

        otp.setAttempts(otp.getAttempts() + 1);
        boolean ok = otp.getCodeHash().equals(hashCode(phone, trimmed));
        if (!ok) {
            phoneOtpRepository.save(otp);
            throw new BusinessException("Invalid code");
        }

        otp.setUsedAt(Instant.now());
        phoneOtpRepository.save(otp);
    }

    private void enforceRateLimit(String phone) {
        Instant since = Instant.now().minus(10, ChronoUnit.MINUTES);
        long recent = phoneOtpRepository.countRecent(phone, since);
        if (recent >= otpProperties.getMaxSendsPer10m()) {
            throw new BusinessException("Too many OTP requests. Try again later.");
        }
    }

    private OtpSender sender(OtpChannel channel) {
        return channel == OtpChannel.WHATSAPP ? whatsAppOtpSender : telegramOtpSender;
    }

    private String generateCode() {
        int n = 100000 + new Random().nextInt(900000);
        return String.valueOf(n);
    }

    private String hashCode(String phone, String code) {
        String secret = otpProperties.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new BusinessException("OTP secret is not configured");
        }
        return sha256(secret + ":" + phone + ":" + code);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new BusinessException("OTP hashing failed");
        }
    }

    // phone normalization in PhoneUtils
}


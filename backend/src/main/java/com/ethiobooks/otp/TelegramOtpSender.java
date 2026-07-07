package com.ethiobooks.otp;

import com.ethiobooks.config.OtpProperties;
import com.ethiobooks.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class TelegramOtpSender implements OtpSender {

    private final OtpProperties otpProperties;

    @Override
    public void send(String phone, String code) {
        String token = otpProperties.getTelegram().getBotToken();
        String chatId = otpProperties.getTelegram().getChatId();
        if (token == null || token.isBlank() || chatId == null || chatId.isBlank()) {
            throw new BusinessException("Telegram OTP is not configured (missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
        }

        String text = "mysuq OTP\nPhone: " + phone + "\nCode: " + code + "\n(Valid " + otpProperties.getTtlSeconds() + "s)";
        String url = "https://api.telegram.org/bot" + token + "/sendMessage"
                + "?chat_id=" + url(chatId)
                + "&text=" + url(text);

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new BusinessException("Failed to send OTP via Telegram");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Failed to send OTP via Telegram");
        }
    }

    private static String url(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}


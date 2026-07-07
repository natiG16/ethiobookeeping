package com.ethiobooks.auth;

import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.config.GoogleProperties;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoogleTokenService {

    private final GoogleProperties googleProperties;

    public GoogleUserInfo verify(String idTokenString) {
        List<String> audiences = googleProperties.getClientIdList();
        if (audiences.isEmpty()) {
            throw new BusinessException("Google Sign-In is not configured on the server");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(audiences)
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BusinessException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new BusinessException("Google email is not verified");
            }

            return new GoogleUserInfo(
                    payload.getSubject(),
                    payload.getEmail().toLowerCase(),
                    (String) payload.get("name"),
                    (String) payload.get("picture")
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Failed to verify Google token: " + e.getMessage());
        }
    }

    public record GoogleUserInfo(
            String googleId,
            String email,
            String fullName,
            String pictureUrl
    ) {}
}

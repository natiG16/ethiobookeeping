package com.ethiobooks.auth.dto;

import com.ethiobooks.users.dto.UserDto;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private UserDto user;
    /** Primary business for the user (set after register / Google onboarding). */
    private UUID businessId;
    private String businessName;
    private String subscriptionPlan;
    private Boolean subscriptionActive;
}

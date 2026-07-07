package com.ethiobooks.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    /** Google ID token from Sign-In (web or mobile SDK). */
    @NotBlank
    private String idToken;

    /** Required when registering a new account via Google. */
    @Size(max = 255)
    private String businessName;

    @Size(max = 100)
    private String businessType;

    @Size(max = 20)
    private String phone;

    private String locale = "en";
}

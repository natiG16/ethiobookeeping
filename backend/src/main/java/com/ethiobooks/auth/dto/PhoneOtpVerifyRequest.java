package com.ethiobooks.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhoneOtpVerifyRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String code;

    /** Only required when creating a new account. */
    private String fullName;

    /** Only required when creating a new account. */
    private String businessName;

    private String businessType;

    private String locale;
}


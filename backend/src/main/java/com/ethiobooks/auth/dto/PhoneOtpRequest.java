package com.ethiobooks.auth.dto;

import com.ethiobooks.otp.OtpChannel;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhoneOtpRequest {

    @NotBlank
    private String phone;

    private OtpChannel channel = OtpChannel.TELEGRAM;
}


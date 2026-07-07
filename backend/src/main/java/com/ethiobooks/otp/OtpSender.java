package com.ethiobooks.otp;

public interface OtpSender {
    void send(String phone, String code);
}


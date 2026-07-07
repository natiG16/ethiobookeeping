package com.ethiobooks.otp;

import com.ethiobooks.common.exception.BusinessException;
import org.springframework.stereotype.Component;

/**
 * Stub sender. WhatsApp delivery requires Meta WhatsApp Business Cloud API credentials.
 * We keep this as a placeholder until integration is added.
 */
@Component
public class WhatsAppOtpSender implements OtpSender {
    @Override
    public void send(String phone, String code) {
        throw new BusinessException("WhatsApp OTP is not configured yet. Use Telegram for now.");
    }
}


package com.ethiobooks.common.util;

import com.ethiobooks.common.exception.BusinessException;
import org.springframework.util.StringUtils;

public final class PhoneUtils {

    private PhoneUtils() {}

    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) throw new BusinessException("Phone is required");
        String phone = raw.trim().replace(" ", "");
        if (phone.startsWith("00")) phone = "+" + phone.substring(2);
        if (!phone.matches("^\\+?\\d{9,15}$")) {
            throw new BusinessException("Invalid phone number");
        }
        return phone.startsWith("+") ? phone : "+" + phone;
    }
}


package com.ethiobooks.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentMethodStatDto {

    private String method;
    private BigDecimal income;
    private BigDecimal expenses;
}

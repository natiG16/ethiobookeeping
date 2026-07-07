package com.ethiobooks.customers.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CustomerDto {

    private UUID id;
    private String name;
    private String phone;
    private String notes;
    private BigDecimal amountOwed;
    private long activeDebtCount;
}

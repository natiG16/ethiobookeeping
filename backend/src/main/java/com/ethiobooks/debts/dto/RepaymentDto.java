package com.ethiobooks.debts.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RepaymentDto {

    private UUID id;
    private UUID debtId;
    private String customerName;
    private BigDecimal amount;
    private String paymentMethod;
    private String notes;
    private LocalDate repaymentDate;
}

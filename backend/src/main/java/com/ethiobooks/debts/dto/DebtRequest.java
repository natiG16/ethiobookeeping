package com.ethiobooks.debts.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class DebtRequest {

    private UUID customerId;

    @NotBlank
    private String customerName;

    private String customerPhone;

    @NotNull @DecimalMin("0.01")
    private BigDecimal totalAmount;

    private LocalDate dueDate;

    private String notes;
}

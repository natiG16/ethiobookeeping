package com.ethiobooks.suppliers.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SupplierPaymentRequest {

    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;

    private String paymentMethod;

    private String notes;

    private LocalDate paymentDate;
}

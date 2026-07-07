package com.ethiobooks.suppliers.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class SupplierPayableRequest {

    @NotNull
    private UUID supplierId;

    @NotNull @DecimalMin("0.01")
    private BigDecimal totalAmount;

    private LocalDate dueDate;

    private String description;

    private String notes;
}

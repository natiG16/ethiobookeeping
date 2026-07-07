package com.ethiobooks.suppliers.dto;

import com.ethiobooks.suppliers.domain.SupplierPayableStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SupplierPayableDto {

    private UUID id;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private SupplierPayableStatus status;
    private String description;
    private String notes;
}

package com.ethiobooks.suppliers.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SupplierPaymentDto {

    private UUID id;
    private UUID payableId;
    private String supplierName;
    private BigDecimal amount;
    private String paymentMethod;
    private String notes;
    private LocalDate paymentDate;
}

package com.ethiobooks.suppliers.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class SupplierDto {

    private UUID id;
    private String name;
    private String phone;
    private String contactPerson;
    private String notes;
    private BigDecimal amountOwed;
    private long activePayableCount;
}

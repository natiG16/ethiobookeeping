package com.ethiobooks.debts.dto;

import com.ethiobooks.debts.domain.DebtStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class DebtDto {

    private UUID id;
    private String customerName;
    private String customerPhone;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private DebtStatus status;
    private String notes;
}

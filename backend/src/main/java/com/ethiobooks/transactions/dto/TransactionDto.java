package com.ethiobooks.transactions.dto;

import com.ethiobooks.transactions.domain.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TransactionDto {

    private UUID id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private String paymentMethod;
    private LocalDate transactionDate;
    private UUID categoryId;
    private String categoryName;
    private UUID productId;
    private String productName;
    private BigDecimal productQuantity;
    private String clientId;
    private boolean synced;
    private Instant createdAt;
}

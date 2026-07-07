package com.ethiobooks.transactions.dto;

import com.ethiobooks.common.json.NullableUuidDeserializer;
import com.ethiobooks.transactions.domain.TransactionType;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TransactionRequest {

    @NotNull
    private TransactionType type;

    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;

    private String description;

    private String paymentMethod;

    private LocalDate transactionDate;

    @JsonDeserialize(using = NullableUuidDeserializer.class)
    private UUID categoryId;

    @JsonDeserialize(using = NullableUuidDeserializer.class)
    private UUID productId;

    /** Units sold when linking an income transaction to inventory. */
    private java.math.BigDecimal productQuantity;

    private String clientId;
}

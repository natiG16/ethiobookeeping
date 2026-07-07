package com.ethiobooks.dashboard.dto;

import com.ethiobooks.transactions.domain.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CategoryStatDto {
    private String categoryName;
    private TransactionType type;
    private BigDecimal amount;
}

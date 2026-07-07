package com.ethiobooks.transactions.dto;

import java.math.BigDecimal;

public record TransactionListSummaryDto(
        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        long incomeCount,
        long expenseCount) {
}

package com.ethiobooks.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PeriodComparisonDto {
    private BigDecimal previousMonthIncome;
    private BigDecimal previousMonthExpenses;
    private BigDecimal previousMonthProfit;
    private BigDecimal incomeChangePercent;
    private BigDecimal expenseChangePercent;
    private BigDecimal profitChangePercent;
}

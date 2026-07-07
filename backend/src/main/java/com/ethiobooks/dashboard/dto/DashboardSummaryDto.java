package com.ethiobooks.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardSummaryDto {

    private BigDecimal todayIncome;
    private BigDecimal todayExpenses;
    private BigDecimal todayProfit;
    private BigDecimal unpaidDebts;
    private BigDecimal todayCollections;
    private BigDecimal monthIncome;
    private BigDecimal monthExpenses;
    /** Product cost deducted from sales (buy price × qty sold). */
    private BigDecimal monthCogs;
    private BigDecimal monthProfit;
    private List<ChartDataPoint> weeklyChart;

    /** Pro plan: income & expenses by payment method this month */
    private List<PaymentMethodStatDto> paymentMethodBreakdown;

    private DashboardAnalyticsDto analytics;

    private PeriodComparisonDto periodComparison;

    private List<CategoryStatDto> topExpenseCategories;

    private List<CategoryStatDto> topIncomeCategories;

    /** Month profit minus unpaid customer debts (simple working-capital snapshot). */
    private BigDecimal netAfterDebts;

    /** Active products at or below their low-stock threshold. */
    private long lowStockCount;
}

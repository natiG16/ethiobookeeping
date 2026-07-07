package com.ethiobooks.reports;

import com.ethiobooks.reports.dto.ReportAnalyticsDto;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class ReportAnalyticsCalculator {

    private ReportAnalyticsCalculator() {}

    public static ReportAnalyticsDto compute(
            List<Transaction> lines,
            BigDecimal income,
            BigDecimal expenses,
            BigDecimal costOfGoodsSold,
            BigDecimal profit) {
        int incomeCount = 0;
        int expenseCount = 0;
        Map<String, BigDecimal> byPayment = new HashMap<>();

        for (Transaction tx : lines) {
            if (tx.getType() == TransactionType.INCOME) {
                incomeCount++;
            } else {
                expenseCount++;
            }
            String method = tx.getPaymentMethod() != null && !tx.getPaymentMethod().isBlank()
                    ? tx.getPaymentMethod()
                    : "Other";
            BigDecimal amt = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            byPayment.merge(method, amt, BigDecimal::add);
        }

        BigDecimal avgIncome = incomeCount > 0
                ? income.divide(BigDecimal.valueOf(incomeCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal avgExpense = expenseCount > 0
                ? expenses.divide(BigDecimal.valueOf(expenseCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String topMethod = "—";
        BigDecimal topAmount = BigDecimal.ZERO;
        var top = byPayment.entrySet().stream()
                .max(Comparator.comparing(Map.Entry::getValue));
        if (top.isPresent()) {
            topMethod = top.get().getKey();
            topAmount = top.get().getValue();
        }

        BigDecimal margin = BigDecimal.ZERO;
        if (income.signum() > 0) {
            margin = profit.multiply(BigDecimal.valueOf(100))
                    .divide(income, 1, RoundingMode.HALF_UP);
        }

        return ReportAnalyticsDto.builder()
                .transactionCount(lines.size())
                .incomeCount(incomeCount)
                .expenseCount(expenseCount)
                .incomeTotal(income)
                .expenseTotal(expenses)
                .profit(profit)
                .avgIncome(avgIncome)
                .avgExpense(avgExpense)
                .topPaymentMethod(topMethod)
                .topPaymentAmount(topAmount)
                .profitMarginPercent(margin)
                .build();
    }
}

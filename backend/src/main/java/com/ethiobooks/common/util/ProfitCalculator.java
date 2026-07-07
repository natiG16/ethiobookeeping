package com.ethiobooks.common.util;

import com.ethiobooks.inventory.domain.Product;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;

import java.math.BigDecimal;

/**
 * Profit from sales: for inventory-linked income, margin = sale amount − (buy price × qty).
 * Example: sell at 12, buy at 10, qty 1 → profit contribution 2.
 */
public final class ProfitCalculator {

    private ProfitCalculator() {}

    public static BigDecimal costOfGoodsSold(Transaction tx) {
        if (tx == null || tx.getType() != TransactionType.INCOME) {
            return BigDecimal.ZERO;
        }
        Product product = tx.getProduct();
        BigDecimal quantity = tx.getProductQuantity();
        if (product == null || quantity == null || quantity.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal buyPrice = product.getBuyPrice();
        if (buyPrice == null || buyPrice.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return buyPrice.multiply(quantity);
    }

    public static BigDecimal netProfit(BigDecimal income, BigDecimal expenses, BigDecimal costOfGoodsSold) {
        BigDecimal revenue = income != null ? income : BigDecimal.ZERO;
        BigDecimal costs = expenses != null ? expenses : BigDecimal.ZERO;
        BigDecimal cogs = costOfGoodsSold != null ? costOfGoodsSold : BigDecimal.ZERO;
        return revenue.subtract(cogs).subtract(costs);
    }
}

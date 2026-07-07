package com.ethiobooks.inventory.domain;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String sku;

    @Column(name = "quantity_on_hand", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    @Column(name = "buy_price", precision = 18, scale = 2)
    private BigDecimal buyPrice;

    @Column(name = "sell_price", precision = 18, scale = 2)
    private BigDecimal sellPrice;

    @Column(name = "low_stock_threshold", precision = 18, scale = 3)
    private BigDecimal lowStockThreshold;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String unit = "pcs";

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    public boolean isLowStock() {
        return lowStockThreshold != null
                && quantityOnHand.compareTo(lowStockThreshold) <= 0;
    }
}

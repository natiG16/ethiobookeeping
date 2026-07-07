package com.ethiobooks.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductDto {

    private UUID id;
    private String name;
    private String sku;
    private BigDecimal quantityOnHand;
    /** Total units sold via linked income transactions. */
    private BigDecimal quantitySold;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal lowStockThreshold;
    private String unit;
    private boolean active;
    private boolean lowStock;
}

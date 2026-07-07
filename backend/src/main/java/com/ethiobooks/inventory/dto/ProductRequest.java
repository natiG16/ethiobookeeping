package com.ethiobooks.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank
    private String name;

    private String sku;

    @NotNull @DecimalMin("0")
    private BigDecimal quantityOnHand;

    private BigDecimal buyPrice;

    private BigDecimal sellPrice;

    private BigDecimal lowStockThreshold;

    private String unit;
}

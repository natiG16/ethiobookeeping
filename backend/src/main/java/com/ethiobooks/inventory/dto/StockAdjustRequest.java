package com.ethiobooks.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockAdjustRequest {

    /** Positive to add stock, negative to remove (damage, correction, etc.). */
    @NotNull
    private BigDecimal delta;
}

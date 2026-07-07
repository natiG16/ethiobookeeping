package com.ethiobooks.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ChartDataPoint {

    private LocalDate date;
    private BigDecimal income;
    private BigDecimal expenses;
}

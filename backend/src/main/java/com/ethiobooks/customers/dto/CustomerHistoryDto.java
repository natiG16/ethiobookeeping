package com.ethiobooks.customers.dto;

import com.ethiobooks.debts.dto.DebtDto;
import com.ethiobooks.debts.dto.RepaymentDto;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CustomerHistoryDto {

    private UUID id;
    private String name;
    private String phone;
    private BigDecimal totalOwed;
    private List<DebtDto> debts;
    private List<RepaymentDto> repayments;
}

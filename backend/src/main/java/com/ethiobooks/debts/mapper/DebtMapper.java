package com.ethiobooks.debts.mapper;

import com.ethiobooks.debts.domain.Debt;
import com.ethiobooks.debts.dto.DebtDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DebtMapper {

    @Mapping(target = "remainingAmount", expression = "java(debt.getRemainingAmount())")
    DebtDto toDto(Debt debt);
}

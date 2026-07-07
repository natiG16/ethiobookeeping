package com.ethiobooks.transactions.mapper;

import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.dto.TransactionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(target = "categoryId", ignore = true)
    @Mapping(target = "categoryName", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productQuantity", ignore = true)
    TransactionDto toDto(Transaction transaction);
}

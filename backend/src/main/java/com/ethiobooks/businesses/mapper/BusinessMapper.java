package com.ethiobooks.businesses.mapper;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.dto.BusinessDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BusinessMapper {

    @Mapping(target = "id", source = "id")
    BusinessDto toDto(Business business);
}

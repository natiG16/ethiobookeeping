package com.ethiobooks.transactions.dto;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class CategoryDto {
    UUID id;
    String name;
    String color;
    String icon;
    boolean isDefault;
}

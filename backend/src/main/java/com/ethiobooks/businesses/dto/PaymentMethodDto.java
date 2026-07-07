package com.ethiobooks.businesses.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PaymentMethodDto {
    private UUID id;
    private String name;
    private int sortOrder;
    private String logoUrl;
}

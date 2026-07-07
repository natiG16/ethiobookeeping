package com.ethiobooks.businesses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentMethodRequest {
    @NotBlank
    @Size(max = 80)
    private String name;
}

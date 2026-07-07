package com.ethiobooks.suppliers.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupplierRequest {

    @NotBlank
    private String name;

    private String phone;

    private String contactPerson;

    private String notes;
}

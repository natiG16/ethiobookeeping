package com.ethiobooks.transactions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 7)
    private String color;

    @Size(max = 50)
    private String icon;
}

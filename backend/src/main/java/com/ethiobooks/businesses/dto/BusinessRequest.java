package com.ethiobooks.businesses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BusinessRequest {

    @NotBlank @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String businessType;

    @Size(max = 50)
    private String tinNumber;

    private String address;

    @Size(max = 100)
    private String city;
}

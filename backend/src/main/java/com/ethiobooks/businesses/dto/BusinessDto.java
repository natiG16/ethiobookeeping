package com.ethiobooks.businesses.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class BusinessDto {

    private UUID id;
    private String name;
    private String businessType;
    private String tinNumber;
    private String address;
    private String city;
    private String currency;
    private String logoUrl;
    private String subscriptionPlan;
    private boolean subscriptionActive;
    private String supportNotes;
}

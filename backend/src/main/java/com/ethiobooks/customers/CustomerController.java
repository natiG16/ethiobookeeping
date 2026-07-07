package com.ethiobooks.customers;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.customers.dto.CustomerDto;
import com.ethiobooks.customers.dto.CustomerHistoryDto;
import com.ethiobooks.customers.dto.CustomerRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ApiResponse<List<CustomerDto>> list(@PathVariable UUID businessId) {
        return ApiResponse.ok(customerService.list(businessId));
    }

    @GetMapping("/{customerId}")
    public ApiResponse<CustomerDto> get(
            @PathVariable UUID businessId,
            @PathVariable UUID customerId) {
        return ApiResponse.ok(customerService.get(businessId, customerId));
    }

    @GetMapping("/{customerId}/history")
    public ApiResponse<CustomerHistoryDto> history(
            @PathVariable UUID businessId,
            @PathVariable UUID customerId) {
        return ApiResponse.ok(customerService.history(businessId, customerId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CustomerDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.create(businessId, request));
    }

    @PutMapping("/{customerId}")
    public ApiResponse<CustomerDto> update(
            @PathVariable UUID businessId,
            @PathVariable UUID customerId,
            @Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.update(businessId, customerId, request));
    }

    @DeleteMapping("/{customerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID customerId) {
        customerService.delete(businessId, customerId);
    }
}

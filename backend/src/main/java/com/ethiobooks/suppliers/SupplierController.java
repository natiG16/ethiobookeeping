package com.ethiobooks.suppliers;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.suppliers.dto.SupplierDto;
import com.ethiobooks.suppliers.dto.SupplierPayableDto;
import com.ethiobooks.suppliers.dto.SupplierPayableRequest;
import com.ethiobooks.suppliers.dto.SupplierPaymentDto;
import com.ethiobooks.suppliers.dto.SupplierPaymentRequest;
import com.ethiobooks.suppliers.dto.SupplierRequest;
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
@RequestMapping("/businesses/{businessId}/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ApiResponse<List<SupplierDto>> listSuppliers(@PathVariable UUID businessId) {
        return ApiResponse.ok(supplierService.listSuppliers(businessId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SupplierDto> createSupplier(
            @PathVariable UUID businessId,
            @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(supplierService.createSupplier(businessId, request));
    }

    @PutMapping("/{supplierId}")
    public ApiResponse<SupplierDto> updateSupplier(
            @PathVariable UUID businessId,
            @PathVariable UUID supplierId,
            @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(supplierService.updateSupplier(businessId, supplierId, request));
    }

    @DeleteMapping("/{supplierId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupplier(
            @PathVariable UUID businessId,
            @PathVariable UUID supplierId) {
        supplierService.deleteSupplier(businessId, supplierId);
    }

    @GetMapping("/payables")
    public ApiResponse<List<SupplierPayableDto>> listPayables(@PathVariable UUID businessId) {
        return ApiResponse.ok(supplierService.listPayables(businessId));
    }

    @PostMapping("/payables")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SupplierPayableDto> createPayable(
            @PathVariable UUID businessId,
            @Valid @RequestBody SupplierPayableRequest request) {
        return ApiResponse.ok(supplierService.createPayable(businessId, request));
    }

    @GetMapping("/payables/{payableId}/payments")
    public ApiResponse<List<SupplierPaymentDto>> listPayments(
            @PathVariable UUID businessId,
            @PathVariable UUID payableId) {
        return ApiResponse.ok(supplierService.listPayments(businessId, payableId));
    }

    @PostMapping("/payables/{payableId}/payments")
    public ApiResponse<SupplierPayableDto> addPayment(
            @PathVariable UUID businessId,
            @PathVariable UUID payableId,
            @Valid @RequestBody SupplierPaymentRequest request) {
        return ApiResponse.ok(supplierService.addPayment(businessId, payableId, request));
    }
}

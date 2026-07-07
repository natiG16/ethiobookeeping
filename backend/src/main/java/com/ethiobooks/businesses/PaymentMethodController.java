package com.ethiobooks.businesses;

import com.ethiobooks.businesses.dto.PaymentMethodDto;
import com.ethiobooks.businesses.dto.PaymentMethodRequest;
import com.ethiobooks.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @GetMapping
    public ApiResponse<List<PaymentMethodDto>> list(@PathVariable UUID businessId) {
        return ApiResponse.ok(paymentMethodService.list(businessId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentMethodDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody PaymentMethodRequest request) {
        return ApiResponse.ok(paymentMethodService.create(businessId, request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentMethodDto> createWithLogo(
            @PathVariable UUID businessId,
            @RequestPart("name") String name,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ApiResponse.ok(paymentMethodService.create(businessId, name, file));
    }

    @PostMapping(value = "/{methodId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PaymentMethodDto> uploadLogo(
            @PathVariable UUID businessId,
            @PathVariable UUID methodId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(paymentMethodService.uploadLogo(businessId, methodId, file));
    }

    @DeleteMapping("/{methodId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID methodId) {
        paymentMethodService.delete(businessId, methodId);
    }
}

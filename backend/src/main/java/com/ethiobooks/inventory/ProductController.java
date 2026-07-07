package com.ethiobooks.inventory;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.inventory.dto.ProductDto;
import com.ethiobooks.inventory.dto.ProductRequest;
import com.ethiobooks.inventory.dto.StockAdjustRequest;
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
@RequestMapping("/businesses/{businessId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<ProductDto>> list(@PathVariable UUID businessId) {
        return ApiResponse.ok(productService.list(businessId));
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<ProductDto>> lowStock(@PathVariable UUID businessId) {
        return ApiResponse.ok(productService.lowStock(businessId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(productService.create(businessId, request));
    }

    @PostMapping("/{productId}/adjust")
    public ApiResponse<ProductDto> adjustStock(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody StockAdjustRequest request) {
        return ApiResponse.ok(productService.adjustStock(businessId, productId, request));
    }

    @PutMapping("/{productId}")
    public ApiResponse<ProductDto> update(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(productService.update(businessId, productId, request));
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID productId) {
        productService.delete(businessId, productId);
    }
}

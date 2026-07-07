package com.ethiobooks.transactions;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.transactions.dto.CategoryDto;
import com.ethiobooks.transactions.dto.CategoryRequest;
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
@RequestMapping("/businesses/{businessId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryDto>> list(@PathVariable UUID businessId) {
        return ApiResponse.ok(categoryService.list(businessId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CategoryDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.create(businessId, request));
    }

    @PutMapping("/{categoryId}")
    public ApiResponse<CategoryDto> update(
            @PathVariable UUID businessId,
            @PathVariable UUID categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.update(businessId, categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID categoryId) {
        categoryService.delete(businessId, categoryId);
    }
}

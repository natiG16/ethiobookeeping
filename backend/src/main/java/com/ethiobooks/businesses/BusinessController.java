package com.ethiobooks.businesses;

import com.ethiobooks.businesses.dto.BusinessDto;
import com.ethiobooks.businesses.dto.BusinessRequest;
import com.ethiobooks.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    @GetMapping
    public ApiResponse<List<BusinessDto>> list() {
        return ApiResponse.ok(businessService.listForCurrentUser());
    }

    @GetMapping("/{businessId}")
    public ApiResponse<BusinessDto> get(@PathVariable UUID businessId) {
        return ApiResponse.ok(businessService.getById(businessId));
    }

    @PostMapping
    public ApiResponse<BusinessDto> create(@Valid @RequestBody BusinessRequest request) {
        return ApiResponse.ok(businessService.create(request));
    }

    @PutMapping("/{businessId}")
    public ApiResponse<BusinessDto> update(
            @PathVariable UUID businessId,
            @Valid @RequestBody BusinessRequest request) {
        return ApiResponse.ok(businessService.update(businessId, request));
    }

    @PostMapping(value = "/{businessId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BusinessDto> uploadLogo(
            @PathVariable UUID businessId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(businessService.uploadLogo(businessId, file));
    }

    @DeleteMapping("/{businessId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId) {
        businessService.delete(businessId);
    }
}

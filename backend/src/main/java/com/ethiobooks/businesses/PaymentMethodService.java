package com.ethiobooks.businesses;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.domain.BusinessPaymentMethod;
import com.ethiobooks.businesses.dto.PaymentMethodDto;
import com.ethiobooks.businesses.dto.PaymentMethodRequest;
import com.ethiobooks.businesses.repository.BusinessPaymentMethodRepository;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.common.storage.FileStorageService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PaymentMethodService {

    private static final List<String> DEFAULT_NAMES = List.of("Cash", "Telebirr", "CBE", "Other Bank");
    private static final Set<String> PROTECTED_DEFAULTS = Set.of("Cash", "Telebirr", "CBE", "Other Bank");

    private final BusinessPaymentMethodRepository repository;
    private final BusinessService businessService;
    private final FileStorageService fileStorageService;

    public PaymentMethodService(
            BusinessPaymentMethodRepository repository,
            @Lazy BusinessService businessService,
            FileStorageService fileStorageService) {
        this.repository = repository;
        this.businessService = businessService;
        this.fileStorageService = fileStorageService;
    }

    public List<PaymentMethodDto> list(UUID businessId) {
        businessService.findOwned(businessId);
        ensureDefaults(businessId);
        return repository.findByBusinessIdOrderBySortOrderAscNameAsc(businessId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PaymentMethodDto create(UUID businessId, PaymentMethodRequest request) {
        return create(businessId, request.getName(), null);
    }

    @Transactional
    public PaymentMethodDto create(UUID businessId, String name, MultipartFile logoFile) {
        Business business = businessService.findOwned(businessId);
        String trimmed = name != null ? name.trim() : "";
        if (trimmed.isBlank()) {
            throw new BusinessException("Payment method name is required");
        }
        if (repository.existsByBusinessIdAndNameIgnoreCase(businessId, trimmed)) {
            throw new BusinessException("This payment method already exists");
        }
        int order = (int) repository.countByBusinessId(businessId);
        BusinessPaymentMethod method = repository.save(BusinessPaymentMethod.builder()
                .business(business)
                .name(trimmed)
                .sortOrder(order)
                .build());
        if (logoFile != null && !logoFile.isEmpty()) {
            method.setLogoUrl(fileStorageService.storePaymentMethodLogo(method.getId(), logoFile));
            method = repository.save(method);
        }
        return toDto(method);
    }

    @Transactional
    public PaymentMethodDto uploadLogo(UUID businessId, UUID methodId, MultipartFile file) {
        businessService.findOwned(businessId);
        BusinessPaymentMethod method = repository
                .findByIdAndBusinessId(methodId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found"));
        if (PROTECTED_DEFAULTS.contains(method.getName())) {
            throw new BusinessException("Built-in payment methods cannot have a custom logo");
        }
        method.setLogoUrl(fileStorageService.storePaymentMethodLogo(method.getId(), file));
        return toDto(repository.save(method));
    }

    private PaymentMethodDto toDto(BusinessPaymentMethod method) {
        return PaymentMethodDto.builder()
                .id(method.getId())
                .name(method.getName())
                .sortOrder(method.getSortOrder())
                .logoUrl(method.getLogoUrl())
                .build();
    }

    @Transactional
    public void delete(UUID businessId, UUID methodId) {
        businessService.findOwned(businessId);
        BusinessPaymentMethod method = repository
                .findByIdAndBusinessId(methodId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found"));
        if (PROTECTED_DEFAULTS.contains(method.getName())) {
            throw new BusinessException("Built-in payment methods cannot be deleted");
        }
        repository.delete(method);
    }

    @Transactional
    public void ensureDefaults(UUID businessId) {
        if (repository.countByBusinessId(businessId) > 0) {
            return;
        }
        Business business = businessService.findOwned(businessId);
        for (int i = 0; i < DEFAULT_NAMES.size(); i++) {
            repository.save(BusinessPaymentMethod.builder()
                    .business(business)
                    .name(DEFAULT_NAMES.get(i))
                    .sortOrder(i)
                    .build());
        }
    }

    @Transactional
    public void seedDefaults(Business business) {
        for (int i = 0; i < DEFAULT_NAMES.size(); i++) {
            repository.save(BusinessPaymentMethod.builder()
                    .business(business)
                    .name(DEFAULT_NAMES.get(i))
                    .sortOrder(i)
                    .build());
        }
    }
}

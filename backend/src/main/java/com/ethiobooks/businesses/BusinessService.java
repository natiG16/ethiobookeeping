package com.ethiobooks.businesses;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.dto.BusinessDto;
import com.ethiobooks.businesses.dto.BusinessRequest;
import com.ethiobooks.businesses.mapper.BusinessMapper;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.CategorySeeder;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.repository.UserRepository;
import com.ethiobooks.common.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final BusinessMapper businessMapper;
    private final PlanFeatureService planFeatureService;
    private final CategorySeeder categorySeeder;
    private final FileStorageService fileStorageService;
    private final PaymentMethodService paymentMethodService;

    public List<BusinessDto> listForCurrentUser() {
        return businessRepository.findByOwnerId(SecurityUtils.currentUserId())
                .stream()
                .map(businessMapper::toDto)
                .toList();
    }

    public BusinessDto getById(UUID businessId) {
        return businessMapper.toDto(findOwned(businessId));
    }

    @Transactional
    public BusinessDto create(BusinessRequest request) {
        UUID ownerId = SecurityUtils.currentUserId();
        planFeatureService.requireCanAddBusiness(ownerId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String plan = planFeatureService.resolveEffectivePlan(ownerId);
        boolean subscriptionActive = businessRepository.findByOwnerId(ownerId).stream()
                .anyMatch(Business::isSubscriptionActive);
        if (businessRepository.countByOwnerId(ownerId) == 0) {
            subscriptionActive = true;
        }

        Business business = Business.builder()
                .owner(owner)
                .name(request.getName())
                .businessType(request.getBusinessType())
                .tinNumber(request.getTinNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .subscriptionPlan(plan)
                .subscriptionActive(subscriptionActive)
                .build();
        business = businessRepository.save(business);
        categorySeeder.seedDefaults(business);
        paymentMethodService.seedDefaults(business);
        return businessMapper.toDto(business);
    }

    @Transactional
    public BusinessDto uploadLogo(UUID businessId, MultipartFile file) {
        Business business = findOwned(businessId);
        String logoUrl = fileStorageService.storeBusinessLogo(businessId, file);
        business.setLogoUrl(logoUrl);
        return businessMapper.toDto(businessRepository.save(business));
    }

    @Transactional
    public BusinessDto update(UUID businessId, BusinessRequest request) {
        Business business = findOwned(businessId);
        business.setName(request.getName());
        business.setBusinessType(request.getBusinessType());
        business.setTinNumber(request.getTinNumber());
        business.setAddress(request.getAddress());
        business.setCity(request.getCity());
        return businessMapper.toDto(businessRepository.save(business));
    }

    public Business findOwned(UUID businessId) {
        Business business = businessRepository.findByIdAndOwnerId(businessId, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        if (!business.isSubscriptionActive()) {
            throw new BusinessException(
                    "Your service has been deactivated. Contact support.");
        }
        return business;
    }

    public Business resolveBusiness(UUID businessId) {
        return findOwned(businessId);
    }

    @Transactional
    public void delete(UUID businessId) {
        UUID ownerId = SecurityUtils.currentUserId();
        Business business = businessRepository.findByIdAndOwnerId(businessId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        long owned = businessRepository.countByOwnerId(ownerId);
        if (owned <= 1) {
            throw new BusinessException("You must keep at least one business.");
        }
        businessRepository.delete(business);
    }

}

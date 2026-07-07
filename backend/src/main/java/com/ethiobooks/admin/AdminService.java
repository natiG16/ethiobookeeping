package com.ethiobooks.admin;

import com.ethiobooks.admin.dto.AdminAccountDto;
import com.ethiobooks.admin.dto.UpdateSubscriptionRequest;
import com.ethiobooks.admin.dto.UpdateUserStatusRequest;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final List<String> PLANS = List.of("starter", "business", "pro");

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public List<AdminAccountDto> listAccounts() {
        return businessRepository.findAllWithOwnerOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AdminAccountDto updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException("Cannot change status of an admin account");
        }
        user.setActive(Boolean.TRUE.equals(request.getActive()));
        userRepository.save(user);
        return businessRepository.findByOwnerId(userId).stream()
                .findFirst()
                .map(this::toDto)
                .orElseGet(() -> AdminAccountDto.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .fullName(user.getFullName())
                        .userActive(user.isActive())
                        .build());
    }

    @Transactional
    public AdminAccountDto updateSubscription(UUID businessId, UpdateSubscriptionRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        String plan = request.getSubscriptionPlan().trim().toLowerCase(Locale.ROOT);
        if (!PLANS.contains(plan)) {
            throw new BusinessException("Invalid plan. Use starter, business, or pro.");
        }
        business.setSubscriptionPlan(plan);
        business.setSubscriptionActive(Boolean.TRUE.equals(request.getSubscriptionActive()));
        business.setSupportNotes(request.getSupportNotes());
        return toDto(businessRepository.save(business));
    }

    private AdminAccountDto toDto(Business business) {
        User owner = business.getOwner();
        return AdminAccountDto.builder()
                .userId(owner.getId())
                .email(owner.getEmail())
                .phone(owner.getPhone())
                .fullName(owner.getFullName())
                .userActive(owner.isActive())
                .businessId(business.getId())
                .businessName(business.getName())
                .subscriptionPlan(business.getSubscriptionPlan())
                .subscriptionActive(business.isSubscriptionActive())
                .supportNotes(business.getSupportNotes())
                .createdAt(business.getCreatedAt())
                .build();
    }
}

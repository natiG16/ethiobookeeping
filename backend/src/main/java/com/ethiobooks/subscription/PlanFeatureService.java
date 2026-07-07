package com.ethiobooks.subscription;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanFeatureService {

    private final BusinessRepository businessRepository;

    public void requireActiveSubscription(Business business) {
        if (!business.isSubscriptionActive()) {
            throw new BusinessException(
                    "Your service has been deactivated. Contact support.");
        }
    }

    public void requirePdfReports(Business business) {
        requirePlanAtLeast(business.getSubscriptionPlan(), "business",
                "PDF reports require the Business plan or higher. Upgrade your plan to continue.");
    }

    /** Search, type, and date range — Business plan and above. */
    public void requireBusinessFilters(Business business) {
        requirePlanAtLeast(business.getSubscriptionPlan(), "business",
                "Advanced filters require the Business plan or higher. Upgrade your plan to continue.");
    }

    /** Payment method filter — Pro plan only. */
    public void requireProFilters(Business business) {
        requirePlanAtLeast(business.getSubscriptionPlan(), "pro",
                "Payment method filter requires the Pro plan. Upgrade your plan to continue.");
    }

    public void requireAdvancedDashboard(Business business) {
        requirePlanAtLeast(business.getSubscriptionPlan(), "pro",
                "Advanced dashboard insights require the Pro plan. Upgrade your plan to continue.");
    }

    public void requireCanAddBusiness(UUID ownerId) {
        long count = businessRepository.countByOwnerId(ownerId);
        String plan = resolveEffectivePlan(ownerId);
        int max = maxBusinessesForPlan(plan);
        if (count >= max) {
            throw new BusinessException(
                    "Your plan allows up to " + max + " business(es). Upgrade to add more.");
        }
    }

    public int maxBusinessesForPlan(String plan) {
        if (plan == null) {
            return 1;
        }
        return switch (plan.toLowerCase()) {
            case "pro" -> 5;
            case "business" -> 3;
            default -> 1;
        };
    }

    public String resolveEffectivePlan(UUID ownerId) {
        List<Business> businesses = businessRepository.findByOwnerId(ownerId);
        String best = "starter";
        for (Business b : businesses) {
            if (hasPlanAtLeast(b.getSubscriptionPlan(), best)) {
                best = normalizePlan(b.getSubscriptionPlan());
            }
        }
        return best;
    }

    private String normalizePlan(String plan) {
        if (plan == null) {
            return "starter";
        }
        return plan.toLowerCase();
    }

    private void requirePlanAtLeast(String plan, String minPlan, String message) {
        if (!hasPlanAtLeast(plan, minPlan)) {
            throw new BusinessException(message);
        }
    }

    public boolean hasPlanAtLeast(String plan, String minPlan) {
        return planRank(plan) >= planRank(minPlan);
    }

    private int planRank(String plan) {
        if (plan == null) {
            return 1;
        }
        return switch (plan.toLowerCase()) {
            case "pro" -> 3;
            case "business" -> 2;
            default -> 1;
        };
    }
}

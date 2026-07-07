package com.ethiobooks.businesses;

import com.ethiobooks.businesses.dto.BusinessRequest;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.security.UserPrincipal;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BusinessCreateIntegrationTest {

    @Autowired
    BusinessService businessService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    BusinessRepository businessRepository;

    @Autowired
    PlanFeatureService planFeatureService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void countByOwnerIdWorks() {
        User user = userRepository.save(User.builder()
                .email("count-test-" + UUID.randomUUID() + "@test.local")
                .passwordHash(passwordEncoder.encode("x"))
                .fullName("Count Test")
                .role(UserRole.OWNER)
                .build());
        assertThat(businessRepository.countByOwnerId(user.getId())).isZero();
    }

    @Test
    void createSecondBusinessFailsOnStarterPlan() {
        User user = userRepository.save(User.builder()
                .email("create-test-" + UUID.randomUUID() + "@test.local")
                .passwordHash(passwordEncoder.encode("x"))
                .fullName("Create Test")
                .role(UserRole.OWNER)
                .build());
        setAuth(user);

        BusinessRequest first = new BusinessRequest();
        first.setName("Shop One");
        businessService.create(first);

        BusinessRequest second = new BusinessRequest();
        second.setName("Shop Two");
        assertThatThrownBy(() -> businessService.create(second))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("allows up to");
    }

    private void setAuth(User user) {
        var principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}

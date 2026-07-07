package com.ethiobooks.transactions;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.dto.BusinessRequest;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.security.UserPrincipal;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.dto.TransactionRequest;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransactionSearchIntegrationTest {

    @Autowired
    TransactionService transactionService;

    @Autowired
    BusinessService businessService;

    @Autowired
    BusinessRepository businessRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    private UUID businessId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("search-test-" + UUID.randomUUID() + "@test.local")
                .passwordHash(passwordEncoder.encode("x"))
                .fullName("Search Test")
                .role(UserRole.OWNER)
                .build());
        setAuth(user);

        BusinessRequest br = new BusinessRequest();
        br.setName("Filter Shop");
        businessId = businessService.create(br).getId();

        var business = businessRepository.findById(businessId).orElseThrow();
        business.setSubscriptionPlan("business");
        business.setSubscriptionActive(true);
        businessRepository.save(business);

        createTx(TransactionType.INCOME, "Coffee sale", "Cash", LocalDate.now().minusDays(10));
        createTx(TransactionType.EXPENSE, "Rent payment", "CBE", LocalDate.now().minusDays(2));
    }

    @Test
    void listAllWithDefaultSortDoesNotError() {
        var page = transactionService.search(
                businessId,
                null,
                null,
                null,
                null,
                null,
                PageRequest.of(0, 20, Sort.by(
                        Sort.Order.desc("transactionDate"),
                        Sort.Order.desc("createdAt"))));

        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(2);
        assertThat(page.getContent()).isNotEmpty();
    }

    @Test
    void searchByTypeAndDescriptionDoesNotError() {
        var page = transactionService.search(
                businessId,
                TransactionType.INCOME,
                null,
                null,
                "coffee",
                null,
                PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().getFirst().getDescription()).containsIgnoringCase("coffee");
    }

    @Test
    void searchByDateRange() {
        LocalDate from = LocalDate.now().minusDays(5);
        LocalDate to = LocalDate.now();
        var page = transactionService.search(
                businessId,
                null,
                from,
                to,
                null,
                null,
                PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().getFirst().getType()).isEqualTo(TransactionType.EXPENSE);
    }

    @Test
    void searchSortedByAmountDescending() {
        TransactionRequest large = new TransactionRequest();
        large.setType(TransactionType.INCOME);
        large.setAmount(new BigDecimal("500.00"));
        large.setDescription("Wholesale");
        large.setPaymentMethod("Cash");
        large.setTransactionDate(LocalDate.now());
        transactionService.create(businessId, large);

        var page = transactionService.search(
                businessId,
                null,
                null,
                null,
                null,
                null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "amount")));

        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(3);
        assertThat(page.getContent().getFirst().getAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
    }

    @Test
    void searchByPaymentMethod() {
        var business = businessRepository.findById(businessId).orElseThrow();
        business.setSubscriptionPlan("business");
        businessRepository.save(business);

        var page = transactionService.search(
                businessId,
                null,
                null,
                null,
                null,
                "CBE",
                PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().getFirst().getPaymentMethod()).isEqualTo("CBE");
    }

    @Test
    void searchByCustomPaymentMethodCaseInsensitive() {
        var business = businessRepository.findById(businessId).orElseThrow();
        business.setSubscriptionPlan("business");
        businessRepository.save(business);

        createTx(TransactionType.INCOME, "Dashen sale", "Dashen", LocalDate.now());

        var page = transactionService.search(
                businessId,
                null,
                null,
                null,
                null,
                "dashen",
                PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().getFirst().getPaymentMethod()).isEqualToIgnoringCase("Dashen");
    }

    private void createTx(TransactionType type, String description, String method, LocalDate date) {
        TransactionRequest req = new TransactionRequest();
        req.setType(type);
        req.setAmount(new BigDecimal("100.00"));
        req.setDescription(description);
        req.setPaymentMethod(method);
        req.setTransactionDate(date);
        transactionService.create(businessId, req);
    }

    private void setAuth(User user) {
        var principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}

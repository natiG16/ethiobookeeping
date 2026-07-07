package com.ethiobooks.reports;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.dto.BusinessRequest;
import com.ethiobooks.businesses.repository.BusinessRepository;
import com.ethiobooks.security.UserPrincipal;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.dto.TransactionRequest;
import com.ethiobooks.transactions.TransactionService;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReportPdfIntegrationTest {

    @Autowired
    ReportService reportService;

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
                .email("pdf-test-" + UUID.randomUUID() + "@test.local")
                .passwordHash(passwordEncoder.encode("x"))
                .fullName("PDF Test")
                .role(UserRole.OWNER)
                .build());
        setAuth(user);

        BusinessRequest br = new BusinessRequest();
        br.setName("PDF Shop");
        businessId = businessService.create(br).getId();

        var business = businessRepository.findById(businessId).orElseThrow();
        business.setSubscriptionPlan("business");
        business.setSubscriptionActive(true);
        businessRepository.save(business);

        createTx(TransactionType.INCOME, "Morning sales", LocalDate.now());
        createTx(TransactionType.EXPENSE, "Supplies", LocalDate.now());
    }

    @Test
    void pdfContainsStatementAndProfitLossSections() throws Exception {
        LocalDate today = LocalDate.now();
        byte[] pdf = reportService.generatePdf(businessId, "daily", today, today);
        assertThat(pdf).isNotEmpty();
        assertThat(pdf.length).isGreaterThan(2_000);

        String text = extractPdfText(pdf);
        assertThat(text).isNotBlank();
        assertThat(text).contains("PDF Shop");
        assertThat(text).contains("Transaction statement");
        assertThat(text).contains("Income");
    }

    private String extractPdfText(byte[] pdf) throws Exception {
        try (PdfDocument doc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)))) {
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i <= doc.getNumberOfPages(); i++) {
                sb.append(PdfTextExtractor.getTextFromPage(doc.getPage(i)));
            }
            return sb.toString();
        }
    }

    private void createTx(TransactionType type, String description, LocalDate date) {
        TransactionRequest req = new TransactionRequest();
        req.setType(type);
        req.setAmount(new BigDecimal("50.00"));
        req.setDescription(description);
        req.setPaymentMethod("Cash");
        req.setTransactionDate(date);
        transactionService.create(businessId, req);
    }

    private void setAuth(User user) {
        var principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}

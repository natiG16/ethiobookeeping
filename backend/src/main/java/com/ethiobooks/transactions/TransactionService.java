package com.ethiobooks.transactions;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.inventory.ProductService;
import com.ethiobooks.inventory.domain.Product;
import com.ethiobooks.inventory.repository.ProductRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.transactions.domain.Category;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.dto.SyncTransactionsRequest;
import com.ethiobooks.transactions.dto.TransactionDto;
import com.ethiobooks.transactions.dto.TransactionListSummaryDto;
import com.ethiobooks.transactions.dto.TransactionRequest;
import com.ethiobooks.transactions.mapper.TransactionMapper;
import com.ethiobooks.transactions.repository.CategoryRepository;
import com.ethiobooks.transactions.repository.TransactionRepository;
import com.ethiobooks.common.util.EthiopianCalendar;
import com.ethiobooks.users.domain.CalendarSystem;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final BusinessService businessService;
    private final UserRepository userRepository;
    private final TransactionMapper transactionMapper;
    private final PlanFeatureService planFeatureService;
    private final TransactionFilterQuery transactionFilterQuery;

    @Transactional(readOnly = true)
    public Page<TransactionDto> search(
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod,
            Pageable pageable) {
        Business business = businessService.findOwned(businessId);
        String term = (search == null || search.isBlank()) ? null : search.trim();
        String method = (paymentMethod == null || paymentMethod.isBlank()) ? null : paymentMethod.trim();
        boolean hasDateFilters = from != null || to != null;
        boolean hasBusinessFilters = type != null || term != null;
        boolean hasProFilters = method != null;
        if (hasBusinessFilters) {
            planFeatureService.requireBusinessFilters(business);
        }
        if (hasProFilters) {
            planFeatureService.requireBusinessFilters(business);
        }
        Page<Transaction> page = !hasDateFilters && !hasBusinessFilters && !hasProFilters
                ? transactionRepository.findByBusinessId(businessId, pageable)
                : transactionFilterQuery.findFiltered(businessId, type, from, to, term, method, pageable);
        List<Transaction> content = page.getContent();
        Map<UUID, Category> categoriesById = loadCategories(content);
        Map<UUID, Product> productsById = loadProducts(content);
        return page.map(transaction -> toDto(transaction, categoriesById, productsById));
    }

    private Map<UUID, Category> loadCategories(List<Transaction> transactions) {
        Set<UUID> categoryIds = new HashSet<>();
        for (Transaction transaction : transactions) {
            Category category = transaction.getCategory();
            if (category != null) {
                categoryIds.add(category.getId());
            }
        }
        if (categoryIds.isEmpty()) {
            return Map.of();
        }
        return categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
    }

    private Map<UUID, Product> loadProducts(List<Transaction> transactions) {
        Set<UUID> productIds = new HashSet<>();
        for (Transaction transaction : transactions) {
            Product product = transaction.getProduct();
            if (product != null) {
                productIds.add(product.getId());
            }
        }
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private TransactionDto toDto(Transaction transaction) {
        List<Transaction> single = List.of(transaction);
        return toDto(transaction, loadCategories(single), loadProducts(single));
    }

    private TransactionDto toDto(
            Transaction transaction,
            Map<UUID, Category> categoriesById,
            Map<UUID, Product> productsById) {
        TransactionDto dto = transactionMapper.toDto(transaction);
        Category category = transaction.getCategory();
        if (category != null) {
            UUID categoryId = category.getId();
            dto.setCategoryId(categoryId);
            Category resolved = categoriesById.get(categoryId);
            dto.setCategoryName(resolved != null ? resolved.getName() : null);
        } else {
            dto.setCategoryId(null);
            dto.setCategoryName(null);
        }
        Product product = transaction.getProduct();
        if (product != null) {
            UUID productId = product.getId();
            dto.setProductId(productId);
            dto.setProductQuantity(transaction.getProductQuantity());
            Product resolved = productsById.get(productId);
            dto.setProductName(resolved != null ? resolved.getName() : null);
        } else {
            dto.setProductId(null);
            dto.setProductName(null);
            dto.setProductQuantity(null);
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public TransactionDto get(UUID businessId, UUID transactionId) {
        return toDto(findTransaction(businessId, transactionId));
    }

    public TransactionListSummaryDto summarize(
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        Business business = businessService.findOwned(businessId);
        String term = (search == null || search.isBlank()) ? null : search.trim();
        String method = (paymentMethod == null || paymentMethod.isBlank()) ? null : paymentMethod.trim();
        boolean hasBusinessFilters = type != null || term != null;
        boolean hasProFilters = method != null;
        if (hasBusinessFilters) {
            planFeatureService.requireBusinessFilters(business);
        }
        if (hasProFilters) {
            planFeatureService.requireBusinessFilters(business);
        }
        return transactionFilterQuery.summarize(businessId, type, from, to, term, method);
    }

    @Transactional
    public TransactionDto create(UUID businessId, TransactionRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        Transaction transaction = buildTransaction(business, request);
        applyProductSale(transaction, business.getId(), request);
        return toDto(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionDto update(UUID businessId, UUID transactionId, TransactionRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Transaction transaction = findTransaction(businessId, transactionId);
        reverseProductSale(businessId, transaction);
        applyRequest(transaction, businessId, request);
        applyProductSale(transaction, businessId, request);
        return toDto(transactionRepository.save(transaction));
    }

    @Transactional
    public void delete(UUID businessId, UUID transactionId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Transaction transaction = findTransaction(businessId, transactionId);
        reverseProductSale(businessId, transaction);
        transactionRepository.delete(transaction);
    }

    private static final int EXPORT_MAX_ROWS = 10_000;

    @Transactional(readOnly = true)
    public String exportCsv(
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        businessService.findOwned(businessId);
        User user = userRepository.findById(SecurityUtils.currentUserId()).orElseThrow();
        boolean ethiopianCalendar = user.getCalendarSystem() != CalendarSystem.GREGORIAN;
        boolean amharicLabels = "am".equalsIgnoreCase(user.getLocale());

        String term = (search == null || search.isBlank()) ? null : search.trim();
        String method = (paymentMethod == null || paymentMethod.isBlank()) ? null : paymentMethod.trim();
        Pageable pageable = PageRequest.of(0, EXPORT_MAX_ROWS, Sort.by(Sort.Direction.DESC, "transactionDate"));
        List<Transaction> rows = transactionFilterQuery
                .findFiltered(businessId, type, from, to, term, method, pageable)
                .getContent();

        String header = "Date,Type,Amount (ETB),Category,Payment Method,Description";
        StringBuilder body = new StringBuilder();
        for (Transaction t : rows) {
            String categoryName = t.getCategory() != null ? t.getCategory().getName() : "";
            if (!body.isEmpty()) {
                body.append('\n');
            }
            String dateCell = t.getTransactionDate() == null
                    ? ""
                    : EthiopianCalendar.formatForExport(t.getTransactionDate(), ethiopianCalendar, amharicLabels);
            body.append(String.join(",",
                    csvCell(dateCell),
                    csvCell(t.getType() != null ? t.getType().name() : ""),
                    csvCell(t.getAmount() != null ? t.getAmount().toPlainString() : "0"),
                    csvCell(categoryName),
                    csvCell(t.getPaymentMethod() != null ? t.getPaymentMethod() : ""),
                    csvCell(t.getDescription() != null ? t.getDescription() : "")));
        }
        return header + "\n" + body;
    }

    private String csvCell(String value) {
        if (value == null) {
            return "\"\"";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    @Transactional
    public List<TransactionDto> sync(UUID businessId, SyncTransactionsRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        List<TransactionDto> results = new ArrayList<>();
        for (TransactionRequest tx : request.getTransactions()) {
            Transaction transaction = buildTransaction(business, tx);
            applyProductSale(transaction, business.getId(), tx);
            transaction.setSynced(true);
            if (tx.getClientId() != null) {
                transaction.setClientId(tx.getClientId());
            }
            results.add(toDto(transactionRepository.save(transaction)));
        }
        return results;
    }

    private Transaction findTransaction(UUID businessId, UUID transactionId) {
        return transactionRepository.findByIdAndBusinessId(transactionId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    private Transaction buildTransaction(Business business, TransactionRequest request) {
        Transaction transaction = Transaction.builder()
                .business(business)
                .createdBy(userRepository.getReferenceById(SecurityUtils.currentUserId()))
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .paymentMethod(request.getPaymentMethod())
                .transactionDate(request.getTransactionDate() != null
                        ? request.getTransactionDate() : LocalDate.now())
                .clientId(request.getClientId())
                .synced(request.getClientId() == null)
                .build();
        applyCategory(transaction, business.getId(), request.getCategoryId());
        return transaction;
    }

    private void applyRequest(Transaction transaction, UUID businessId, TransactionRequest request) {
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setPaymentMethod(request.getPaymentMethod());
        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }
        applyCategory(transaction, businessId, request.getCategoryId());
    }

    private void applyCategory(Transaction transaction, UUID businessId, UUID categoryId) {
        if (categoryId != null) {
            Category category = categoryRepository.findByIdAndBusinessId(categoryId, businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            transaction.setCategory(category);
        } else {
            transaction.setCategory(null);
        }
    }

    private void applyProductSale(Transaction transaction, UUID businessId, TransactionRequest request) {
        UUID productId = request.getProductId();
        BigDecimal quantity = request.getProductQuantity();
        if (transaction.getType() != TransactionType.INCOME) {
            if (productId != null || (quantity != null && quantity.compareTo(BigDecimal.ZERO) > 0)) {
                throw new BusinessException("Only income transactions can be linked to inventory products");
            }
            transaction.setProduct(null);
            transaction.setProductQuantity(null);
            return;
        }
        if (productId == null) {
            transaction.setProduct(null);
            transaction.setProductQuantity(null);
            return;
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            quantity = BigDecimal.ONE;
        }
        Product product = productService.loadForSale(businessId, productId, quantity);
        transaction.setProduct(product);
        transaction.setProductQuantity(quantity);
    }

    private void reverseProductSale(UUID businessId, Transaction transaction) {
        if (transaction.getType() != TransactionType.INCOME) {
            return;
        }
        Product product = transaction.getProduct();
        BigDecimal quantity = transaction.getProductQuantity();
        if (product != null && quantity != null) {
            UUID productId = product.getId();
            productService.restoreFromSale(businessId, productId, quantity);
        }
    }
}

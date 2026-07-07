package com.ethiobooks.transactions;

import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.ethiobooks.transactions.dto.TransactionListSummaryDto;

@Repository
public class TransactionFilterQuery {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public Page<Transaction> findFiltered(
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod,
            Pageable pageable) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Transaction> cq = cb.createQuery(Transaction.class);
        Root<Transaction> root = cq.from(Transaction.class);

        List<Predicate> predicates = buildPredicates(cb, root, businessId, type, from, to, search, paymentMethod);
        cq.where(predicates.toArray(Predicate[]::new));
        cq.orderBy(orderBy(cb, root, pageable));

        TypedQuery<Transaction> query = entityManager.createQuery(cq);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        List<Transaction> content = query.getResultList();

        long total = countFiltered(cb, businessId, type, from, to, search, paymentMethod);
        return new PageImpl<>(content, pageable, total);
    }

    private long countFiltered(
            CriteriaBuilder cb,
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        CriteriaQuery<Long> countCq = cb.createQuery(Long.class);
        Root<Transaction> root = countCq.from(Transaction.class);
        List<Predicate> predicates = buildPredicates(cb, root, businessId, type, from, to, search, paymentMethod);
        countCq.select(cb.count(root)).where(predicates.toArray(Predicate[]::new));
        return entityManager.createQuery(countCq).getSingleResult();
    }

    private List<Predicate> buildPredicates(
            CriteriaBuilder cb,
            Root<Transaction> root,
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("business").get("id"), businessId));
        if (type != null) {
            predicates.add(cb.equal(root.get("type"), type));
        }
        if (from != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), from));
        }
        if (to != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), to));
        }
        if (search != null && !search.isBlank()) {
            String term = search.trim();
            if (cb instanceof HibernateCriteriaBuilder hcb) {
                predicates.add(hcb.ilike(root.get("description"), "%" + term + "%"));
            } else {
                predicates.add(cb.like(cb.lower(root.get("description")), "%" + term.toLowerCase() + "%"));
            }
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            String method = paymentMethod.trim();
            if (cb instanceof HibernateCriteriaBuilder hcb) {
                predicates.add(hcb.ilike(root.get("paymentMethod"), method));
            } else {
                predicates.add(cb.equal(cb.lower(root.get("paymentMethod")), method.toLowerCase()));
            }
        }
        return predicates;
    }

    private static final Set<String> SORTABLE = Set.of(
            "transactionDate", "amount", "createdAt", "paymentMethod");

    private List<Order> orderBy(CriteriaBuilder cb, Root<Transaction> root, Pageable pageable) {
        List<Order> orders = new ArrayList<>();
        for (Sort.Order sort : pageable.getSort()) {
            if (!SORTABLE.contains(sort.getProperty())) {
                continue;
            }
            orders.add(sort.isAscending()
                    ? cb.asc(root.get(sort.getProperty()))
                    : cb.desc(root.get(sort.getProperty())));
        }
        if (orders.isEmpty()) {
            orders.add(cb.desc(root.get("transactionDate")));
        }
        boolean sortsByCreatedAt = pageable.getSort().stream()
                .anyMatch(o -> "createdAt".equals(o.getProperty()));
        if (!sortsByCreatedAt) {
            orders.add(cb.desc(root.get("createdAt")));
        }
        return orders;
    }

    public TransactionListSummaryDto summarize(
            UUID businessId,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        BigDecimal income = sumAmount(businessId, TransactionType.INCOME, type, from, to, search, paymentMethod);
        BigDecimal expense = sumAmount(businessId, TransactionType.EXPENSE, type, from, to, search, paymentMethod);
        long incomeCount = countRows(businessId, TransactionType.INCOME, type, from, to, search, paymentMethod);
        long expenseCount = countRows(businessId, TransactionType.EXPENSE, type, from, to, search, paymentMethod);
        return new TransactionListSummaryDto(income, expense, incomeCount, expenseCount);
    }

    private BigDecimal sumAmount(
            UUID businessId,
            TransactionType sumType,
            TransactionType filterType,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        if (filterType != null && filterType != sumType) {
            return BigDecimal.ZERO;
        }
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<BigDecimal> cq = cb.createQuery(BigDecimal.class);
        Root<Transaction> root = cq.from(Transaction.class);
        List<Predicate> predicates = buildPredicates(cb, root, businessId, sumType, from, to, search, paymentMethod);
        cq.select(cb.coalesce(cb.sum(root.get("amount")), BigDecimal.ZERO));
        cq.where(predicates.toArray(Predicate[]::new));
        return entityManager.createQuery(cq).getSingleResult();
    }

    private long countRows(
            UUID businessId,
            TransactionType countType,
            TransactionType filterType,
            LocalDate from,
            LocalDate to,
            String search,
            String paymentMethod) {
        if (filterType != null && filterType != countType) {
            return 0L;
        }
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Transaction> root = cq.from(Transaction.class);
        List<Predicate> predicates = buildPredicates(cb, root, businessId, countType, from, to, search, paymentMethod);
        cq.select(cb.count(root)).where(predicates.toArray(Predicate[]::new));
        return entityManager.createQuery(cq).getSingleResult();
    }
}

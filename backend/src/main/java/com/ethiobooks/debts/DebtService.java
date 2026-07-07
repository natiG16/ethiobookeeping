package com.ethiobooks.debts;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.customers.CustomerService;
import com.ethiobooks.customers.domain.Customer;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.debts.domain.Debt;
import com.ethiobooks.debts.domain.DebtStatus;
import com.ethiobooks.debts.domain.Repayment;
import com.ethiobooks.debts.dto.DebtDto;
import com.ethiobooks.debts.dto.DebtRequest;
import com.ethiobooks.debts.dto.RepaymentDto;
import com.ethiobooks.debts.dto.RepaymentRequest;
import com.ethiobooks.debts.mapper.DebtMapper;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.debts.repository.RepaymentRepository;
import com.ethiobooks.notifications.DebtNotificationService;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DebtService {

    private final DebtRepository debtRepository;
    private final RepaymentRepository repaymentRepository;
    private final BusinessService businessService;
    private final UserRepository userRepository;
    private final DebtMapper debtMapper;
    private final PlanFeatureService planFeatureService;
    private final DebtNotificationService debtNotificationService;
    private final CustomerService customerService;

    public Page<DebtDto> list(UUID businessId, Pageable pageable) {
        businessService.findOwned(businessId);
        return debtRepository.findByBusinessIdOrderByCreatedAtDesc(businessId, pageable)
                .map(debtMapper::toDto);
    }

    public List<DebtDto> overdue(UUID businessId) {
        businessService.findOwned(businessId);
        return debtRepository.findOverdue(businessId, LocalDate.now())
                .stream().map(debtMapper::toDto).toList();
    }

    public DebtDto get(UUID businessId, UUID debtId) {
        return debtMapper.toDto(findDebt(businessId, debtId));
    }

    public List<RepaymentDto> listRepayments(UUID businessId, UUID debtId) {
        findDebt(businessId, debtId);
        return repaymentRepository.findByDebtIdOrderByRepaymentDateDesc(debtId).stream()
                .map(this::toRepaymentDto)
                .toList();
    }

    @Transactional
    public DebtDto create(UUID businessId, DebtRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        Customer customer = customerService.resolveForDebt(
                business, request.getCustomerId(), request.getCustomerName(), request.getCustomerPhone());
        Debt debt = Debt.builder()
                .business(business)
                .customer(customer)
                .customerName(customer.getName())
                .customerPhone(customer.getPhone() != null ? customer.getPhone() : request.getCustomerPhone())
                .totalAmount(request.getTotalAmount())
                .dueDate(request.getDueDate())
                .notes(request.getNotes())
                .status(DebtStatus.ACTIVE)
                .build();
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            debt.setStatus(DebtStatus.OVERDUE);
        }
        Debt saved = debtRepository.save(debt);
        debtNotificationService.notifyDebtIfDue(saved, LocalDate.now());
        return debtMapper.toDto(saved);
    }

    @Transactional
    public DebtDto addRepayment(UUID businessId, UUID debtId, RepaymentRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Debt debt = findDebt(businessId, debtId);
        if (debt.getStatus() == DebtStatus.PAID || debt.getStatus() == DebtStatus.CANCELLED) {
            throw new BusinessException("Debt is already closed");
        }
        BigDecimal remaining = debt.getRemainingAmount();
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BusinessException("Repayment exceeds remaining balance");
        }

        Repayment repayment = Repayment.builder()
                .debt(debt)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .notes(request.getNotes())
                .repaymentDate(request.getRepaymentDate() != null
                        ? request.getRepaymentDate() : LocalDate.now())
                .createdBy(userRepository.getReferenceById(SecurityUtils.currentUserId()))
                .build();
        repaymentRepository.save(repayment);

        debt.setPaidAmount(debt.getPaidAmount().add(request.getAmount()));
        if (debt.getPaidAmount().compareTo(debt.getTotalAmount()) >= 0) {
            debt.setStatus(DebtStatus.PAID);
        }
        return debtMapper.toDto(debtRepository.save(debt));
    }

    @Transactional
    public DebtDto markPaid(UUID businessId, UUID debtId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Debt debt = findDebt(businessId, debtId);
        debt.setPaidAmount(debt.getTotalAmount());
        debt.setStatus(DebtStatus.PAID);
        return debtMapper.toDto(debtRepository.save(debt));
    }

    @Transactional
    public void delete(UUID businessId, UUID debtId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Debt debt = findDebt(businessId, debtId);
        debtRepository.delete(debt);
    }

    private Debt findDebt(UUID businessId, UUID debtId) {
        return debtRepository.findByIdAndBusinessId(debtId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Debt not found"));
    }

    private RepaymentDto toRepaymentDto(Repayment r) {
        return RepaymentDto.builder()
                .id(r.getId())
                .debtId(r.getDebt().getId())
                .customerName(r.getDebt().getCustomerName())
                .amount(r.getAmount())
                .paymentMethod(r.getPaymentMethod())
                .notes(r.getNotes())
                .repaymentDate(r.getRepaymentDate())
                .build();
    }
}

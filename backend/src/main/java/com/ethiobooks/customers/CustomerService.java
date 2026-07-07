package com.ethiobooks.customers;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.customers.domain.Customer;
import com.ethiobooks.customers.dto.CustomerDto;
import com.ethiobooks.customers.dto.CustomerHistoryDto;
import com.ethiobooks.customers.dto.CustomerRequest;
import com.ethiobooks.customers.repository.CustomerRepository;
import com.ethiobooks.debts.domain.Debt;
import com.ethiobooks.debts.domain.Repayment;
import com.ethiobooks.debts.dto.DebtDto;
import com.ethiobooks.debts.dto.RepaymentDto;
import com.ethiobooks.debts.mapper.DebtMapper;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.debts.repository.RepaymentRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final DebtRepository debtRepository;
    private final RepaymentRepository repaymentRepository;
    private final BusinessService businessService;
    private final PlanFeatureService planFeatureService;
    private final DebtMapper debtMapper;

    public List<CustomerDto> list(UUID businessId) {
        businessService.findOwned(businessId);
        return customerRepository.findByBusinessIdOrderByNameAsc(businessId).stream()
                .map(c -> toDto(c, businessId))
                .toList();
    }

    public CustomerDto get(UUID businessId, UUID customerId) {
        Customer customer = findOwned(businessId, customerId);
        return toDto(customer, businessId);
    }

    public CustomerHistoryDto history(UUID businessId, UUID customerId) {
        Customer customer = findOwned(businessId, customerId);
        List<Debt> debts = debtRepository.findByBusinessIdAndCustomerOrName(
                businessId, customerId, customer.getName());
        List<DebtDto> debtDtos = debts.stream().map(debtMapper::toDto).toList();
        List<RepaymentDto> repayments = debts.stream()
                .flatMap(d -> repaymentRepository.findByDebtIdOrderByRepaymentDateDesc(d.getId()).stream())
                .sorted(Comparator.comparing(Repayment::getRepaymentDate).reversed())
                .map(this::toRepaymentDto)
                .toList();
        BigDecimal owed = debtRepository.sumRemainingByCustomerOrName(
                businessId, customerId, customer.getName());
        return CustomerHistoryDto.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .totalOwed(owed != null ? owed : BigDecimal.ZERO)
                .debts(debtDtos)
                .repayments(repayments)
                .build();
    }

    @Transactional
    public CustomerDto create(UUID businessId, CustomerRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        String name = request.getName().trim();
        if (customerRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A customer with this name already exists");
        }
        Customer customer = Customer.builder()
                .business(business)
                .name(name)
                .phone(request.getPhone())
                .notes(request.getNotes())
                .build();
        return toDto(customerRepository.save(customer), businessId);
    }

    @Transactional
    public CustomerDto update(UUID businessId, UUID customerId, CustomerRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Customer customer = findOwned(businessId, customerId);
        String name = request.getName().trim();
        if (!customer.getName().equalsIgnoreCase(name)
                && customerRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A customer with this name already exists");
        }
        customer.setName(name);
        customer.setPhone(request.getPhone());
        customer.setNotes(request.getNotes());
        return toDto(customerRepository.save(customer), businessId);
    }

    @Transactional
    public void delete(UUID businessId, UUID customerId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Customer customer = findOwned(businessId, customerId);
        if (debtRepository.countByCustomerId(customerId) > 0) {
            throw new BusinessException("Customer has debts. Remove or reassign debts first.");
        }
        customerRepository.delete(customer);
    }

    @Transactional
    public Customer resolveForDebt(Business business, UUID customerId, String customerName, String phone) {
        if (customerId != null) {
            return findOwned(business.getId(), customerId);
        }
        String name = customerName.trim();
        return customerRepository.findByBusinessIdAndNameIgnoreCase(business.getId(), name)
                .orElseGet(() -> customerRepository.save(Customer.builder()
                        .business(business)
                        .name(name)
                        .phone(phone)
                        .build()));
    }

    public Customer findOwned(UUID businessId, UUID customerId) {
        businessService.findOwned(businessId);
        return customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    }

    private CustomerDto toDto(Customer customer, UUID businessId) {
        BigDecimal owed = debtRepository.sumRemainingByCustomerOrName(
                businessId, customer.getId(), customer.getName());
        long count = debtRepository.countActiveByCustomerOrName(
                businessId, customer.getId(), customer.getName());
        return CustomerDto.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .notes(customer.getNotes())
                .amountOwed(owed != null ? owed : BigDecimal.ZERO)
                .activeDebtCount(count)
                .build();
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

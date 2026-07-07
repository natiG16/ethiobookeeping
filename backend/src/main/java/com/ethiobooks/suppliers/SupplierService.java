package com.ethiobooks.suppliers;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.suppliers.domain.Supplier;
import com.ethiobooks.suppliers.domain.SupplierPayable;
import com.ethiobooks.suppliers.domain.SupplierPayableStatus;
import com.ethiobooks.suppliers.domain.SupplierPayment;
import com.ethiobooks.suppliers.dto.SupplierDto;
import com.ethiobooks.suppliers.dto.SupplierPayableDto;
import com.ethiobooks.suppliers.dto.SupplierPayableRequest;
import com.ethiobooks.suppliers.dto.SupplierPaymentDto;
import com.ethiobooks.suppliers.dto.SupplierPaymentRequest;
import com.ethiobooks.suppliers.dto.SupplierRequest;
import com.ethiobooks.suppliers.repository.SupplierPayableRepository;
import com.ethiobooks.suppliers.repository.SupplierPaymentRepository;
import com.ethiobooks.suppliers.repository.SupplierRepository;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierPayableRepository payableRepository;
    private final SupplierPaymentRepository paymentRepository;
    private final BusinessService businessService;
    private final PlanFeatureService planFeatureService;
    private final UserRepository userRepository;

    public List<SupplierDto> listSuppliers(UUID businessId) {
        businessService.findOwned(businessId);
        return supplierRepository.findByBusinessIdOrderByNameAsc(businessId).stream()
                .map(s -> toSupplierDto(s, businessId))
                .toList();
    }

    public List<SupplierPayableDto> listPayables(UUID businessId) {
        businessService.findOwned(businessId);
        return payableRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(this::toPayableDto)
                .toList();
    }

    public List<SupplierPaymentDto> listPayments(UUID businessId, UUID payableId) {
        findPayable(businessId, payableId);
        return paymentRepository.findByPayableIdOrderByPaymentDateDesc(payableId).stream()
                .map(this::toPaymentDto)
                .toList();
    }

    @Transactional
    public SupplierDto createSupplier(UUID businessId, SupplierRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        String name = request.getName().trim();
        if (supplierRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A supplier with this name already exists");
        }
        Supplier supplier = Supplier.builder()
                .business(business)
                .name(name)
                .phone(request.getPhone())
                .contactPerson(request.getContactPerson())
                .notes(request.getNotes())
                .build();
        return toSupplierDto(supplierRepository.save(supplier), businessId);
    }

    @Transactional
    public SupplierPayableDto createPayable(UUID businessId, SupplierPayableRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        Supplier supplier = supplierRepository.findByIdAndBusinessId(request.getSupplierId(), businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        SupplierPayable payable = SupplierPayable.builder()
                .business(business)
                .supplier(supplier)
                .totalAmount(request.getTotalAmount())
                .dueDate(request.getDueDate())
                .description(request.getDescription())
                .notes(request.getNotes())
                .status(SupplierPayableStatus.ACTIVE)
                .build();
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            payable.setStatus(SupplierPayableStatus.OVERDUE);
        }
        return toPayableDto(payableRepository.save(payable));
    }

    @Transactional
    public SupplierPayableDto addPayment(UUID businessId, UUID payableId, SupplierPaymentRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        SupplierPayable payable = findPayable(businessId, payableId);
        if (payable.getStatus() == SupplierPayableStatus.PAID
                || payable.getStatus() == SupplierPayableStatus.CANCELLED) {
            throw new BusinessException("Payable is already closed");
        }
        if (request.getAmount().compareTo(payable.getRemainingAmount()) > 0) {
            throw new BusinessException("Payment exceeds remaining balance");
        }
        SupplierPayment payment = SupplierPayment.builder()
                .payable(payable)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .notes(request.getNotes())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .createdBy(userRepository.getReferenceById(SecurityUtils.currentUserId()))
                .build();
        paymentRepository.save(payment);
        payable.setPaidAmount(payable.getPaidAmount().add(request.getAmount()));
        if (payable.getPaidAmount().compareTo(payable.getTotalAmount()) >= 0) {
            payable.setStatus(SupplierPayableStatus.PAID);
        }
        return toPayableDto(payableRepository.save(payable));
    }

    @Transactional
    public SupplierDto updateSupplier(UUID businessId, UUID supplierId, SupplierRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Supplier supplier = supplierRepository.findByIdAndBusinessId(supplierId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        String name = request.getName().trim();
        if (!supplier.getName().equalsIgnoreCase(name)
                && supplierRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A supplier with this name already exists");
        }
        supplier.setName(name);
        supplier.setPhone(request.getPhone());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setNotes(request.getNotes());
        return toSupplierDto(supplierRepository.save(supplier), businessId);
    }

    @Transactional
    public void deleteSupplier(UUID businessId, UUID supplierId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Supplier supplier = supplierRepository.findByIdAndBusinessId(supplierId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        long open = payableRepository.countBySupplierIdAndStatusIn(
                supplierId, List.of(SupplierPayableStatus.ACTIVE, SupplierPayableStatus.OVERDUE));
        if (open > 0) {
            throw new BusinessException("Supplier has open payables");
        }
        supplierRepository.delete(supplier);
    }

    private SupplierPayable findPayable(UUID businessId, UUID payableId) {
        return payableRepository.findByIdAndBusinessId(payableId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Payable not found"));
    }

    private SupplierDto toSupplierDto(Supplier supplier, UUID businessId) {
        BigDecimal owed = payableRepository.sumRemainingBySupplier(businessId, supplier.getId());
        long count = payableRepository.countBySupplierIdAndStatusIn(
                supplier.getId(), List.of(SupplierPayableStatus.ACTIVE, SupplierPayableStatus.OVERDUE));
        return SupplierDto.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .phone(supplier.getPhone())
                .contactPerson(supplier.getContactPerson())
                .notes(supplier.getNotes())
                .amountOwed(owed != null ? owed : BigDecimal.ZERO)
                .activePayableCount(count)
                .build();
    }

    private SupplierPayableDto toPayableDto(SupplierPayable p) {
        return SupplierPayableDto.builder()
                .id(p.getId())
                .supplierId(p.getSupplier().getId())
                .supplierName(p.getSupplier().getName())
                .totalAmount(p.getTotalAmount())
                .paidAmount(p.getPaidAmount())
                .remainingAmount(p.getRemainingAmount())
                .dueDate(p.getDueDate())
                .status(p.getStatus())
                .description(p.getDescription())
                .notes(p.getNotes())
                .build();
    }

    private SupplierPaymentDto toPaymentDto(SupplierPayment p) {
        return SupplierPaymentDto.builder()
                .id(p.getId())
                .payableId(p.getPayable().getId())
                .supplierName(p.getPayable().getSupplier().getName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .notes(p.getNotes())
                .paymentDate(p.getPaymentDate())
                .build();
    }
}

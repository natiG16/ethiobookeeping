package com.ethiobooks.inventory;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.inventory.domain.Product;
import com.ethiobooks.inventory.dto.ProductDto;
import com.ethiobooks.inventory.dto.ProductRequest;
import com.ethiobooks.inventory.dto.StockAdjustRequest;
import com.ethiobooks.inventory.repository.ProductRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;
    private final BusinessService businessService;
    private final PlanFeatureService planFeatureService;

    public List<ProductDto> list(UUID businessId) {
        businessService.findOwned(businessId);
        List<Product> products = productRepository.findByBusinessIdAndActiveTrueOrderByNameAsc(businessId);
        Map<UUID, BigDecimal> sold = soldQuantities(products);
        return products.stream()
                .map(p -> toDto(p, sold.getOrDefault(p.getId(), BigDecimal.ZERO)))
                .toList();
    }

    public List<ProductDto> lowStock(UUID businessId) {
        businessService.findOwned(businessId);
        List<Product> products = productRepository.findLowStock(businessId);
        Map<UUID, BigDecimal> sold = soldQuantities(products);
        return products.stream()
                .map(p -> toDto(p, sold.getOrDefault(p.getId(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public Product loadForSale(UUID businessId, UUID productId, BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            quantity = BigDecimal.ONE;
        }
        int updated = productRepository.decrementQuantity(productId, businessId, quantity);
        if (updated == 0) {
            Product product = productRepository.findByIdAndBusinessId(productId, businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (!product.isActive()) {
                throw new BusinessException("Product is not active");
            }
            throw new BusinessException("Insufficient stock for " + product.getName());
        }
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    @Transactional
    public void restoreFromSale(UUID businessId, UUID productId, BigDecimal quantity) {
        if (productId == null || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        productRepository.incrementQuantity(productId, businessId, quantity);
    }

    @Transactional
    public ProductDto create(UUID businessId, ProductRequest request) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        String name = request.getName().trim();
        if (productRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A product with this name already exists");
        }
        return toDto(productRepository.save(fromRequest(business, request, name)), BigDecimal.ZERO);
    }

    @Transactional
    public ProductDto update(UUID businessId, UUID productId, ProductRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Product product = findOwned(businessId, productId);
        String name = request.getName().trim();
        if (!product.getName().equalsIgnoreCase(name)
                && productRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A product with this name already exists");
        }
        applyRequest(product, request, name);
        BigDecimal sold = transactionRepository.sumSoldQuantityByProductId(productId);
        return toDto(productRepository.save(product), sold != null ? sold : BigDecimal.ZERO);
    }

    @Transactional
    public ProductDto adjustStock(UUID businessId, UUID productId, StockAdjustRequest request) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Product product = findOwned(businessId, productId);
        BigDecimal delta = request.getDelta();
        if (delta.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("Adjustment amount cannot be zero");
        }
        BigDecimal newQty = product.getQuantityOnHand().add(delta);
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Insufficient stock for this adjustment");
        }
        product.setQuantityOnHand(newQty);
        BigDecimal sold = transactionRepository.sumSoldQuantityByProductId(productId);
        return toDto(productRepository.save(product), sold != null ? sold : BigDecimal.ZERO);
    }

    @Transactional
    public void delete(UUID businessId, UUID productId) {
        planFeatureService.requireActiveSubscription(businessService.findOwned(businessId));
        Product product = findOwned(businessId, productId);
        product.setActive(false);
        productRepository.save(product);
    }

    private Product findOwned(UUID businessId, UUID productId) {
        businessService.findOwned(businessId);
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private Product fromRequest(Business business, ProductRequest request, String name) {
        Product product = new Product();
        product.setBusiness(business);
        applyRequest(product, request, name);
        return product;
    }

    private void applyRequest(Product product, ProductRequest request, String name) {
        product.setName(name);
        product.setSku(request.getSku());
        product.setQuantityOnHand(request.getQuantityOnHand());
        product.setBuyPrice(request.getBuyPrice());
        product.setSellPrice(request.getSellPrice());
        product.setLowStockThreshold(request.getLowStockThreshold());
        if (request.getUnit() != null && !request.getUnit().isBlank()) {
            product.setUnit(request.getUnit().trim());
        }
    }

    private Map<UUID, BigDecimal> soldQuantities(List<Product> products) {
        if (products.isEmpty()) {
            return Map.of();
        }
        Set<UUID> ids = products.stream().map(Product::getId).collect(Collectors.toSet());
        Map<UUID, BigDecimal> sold = new HashMap<>();
        for (Object[] row : transactionRepository.sumSoldQuantityByProductIds(ids)) {
            sold.put((UUID) row[0], (BigDecimal) row[1]);
        }
        return sold;
    }

    private ProductDto toDto(Product p, BigDecimal quantitySold) {
        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .quantityOnHand(p.getQuantityOnHand())
                .quantitySold(quantitySold != null ? quantitySold : BigDecimal.ZERO)
                .buyPrice(p.getBuyPrice())
                .sellPrice(p.getSellPrice())
                .lowStockThreshold(p.getLowStockThreshold())
                .unit(p.getUnit())
                .active(p.isActive())
                .lowStock(p.isLowStock())
                .build();
    }
}

package com.ethiobooks.transactions;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.exception.ResourceNotFoundException;
import com.ethiobooks.transactions.domain.Category;
import com.ethiobooks.transactions.dto.CategoryDto;
import com.ethiobooks.transactions.dto.CategoryRequest;
import com.ethiobooks.transactions.repository.CategoryRepository;
import com.ethiobooks.transactions.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BusinessService businessService;
    private final CategorySeeder categorySeeder;

    @Transactional
    public List<CategoryDto> list(UUID businessId) {
        Business business = businessService.findOwned(businessId);
        categorySeeder.seedDefaults(business);
        return categoryRepository.findByBusinessIdOrderByNameAsc(businessId).stream()
                .sorted(CategorySeeder.defaultSortComparator())
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CategoryDto create(UUID businessId, CategoryRequest request) {
        Business business = businessService.findOwned(businessId);
        String name = request.getName().trim();
        if (categoryRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A category with this name already exists");
        }
        Category category = Category.builder()
                .business(business)
                .name(name)
                .color(request.getColor() != null ? request.getColor() : "#64748B")
                .icon(request.getIcon())
                .isDefault(false)
                .build();
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto update(UUID businessId, UUID categoryId, CategoryRequest request) {
        Category category = findOwned(businessId, categoryId);
        String name = request.getName().trim();
        if (!category.getName().equalsIgnoreCase(name)
                && categoryRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BusinessException("A category with this name already exists");
        }
        category.setName(name);
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }
        category.setIcon(request.getIcon());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID businessId, UUID categoryId) {
        Category category = findOwned(businessId, categoryId);
        if (category.isDefault()) {
            throw new BusinessException("Default categories cannot be deleted");
        }
        if (transactionRepository.countByCategoryId(categoryId) > 0) {
            throw new BusinessException("Category is used by transactions. Reassign or delete those entries first.");
        }
        categoryRepository.delete(category);
    }

    public Category findOwned(UUID businessId, UUID categoryId) {
        businessService.findOwned(businessId);
        return categoryRepository
                .findByIdAndBusinessId(categoryId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
                .icon(category.getIcon())
                .isDefault(category.isDefault())
                .build();
    }
}

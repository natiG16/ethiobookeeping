package com.ethiobooks.transactions;

import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.transactions.domain.Category;
import com.ethiobooks.transactions.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class CategorySeeder {

    record DefaultCategory(String name, String color, String icon) {}

    static final List<DefaultCategory> DEFAULT_CATEGORIES = List.of(
            new DefaultCategory("Rent", "#EF4444", "home"),
            new DefaultCategory("Transport", "#8B5CF6", "truck"),
            new DefaultCategory("Salary", "#F97316", "users"),
            new DefaultCategory("Utilities", "#6366F1", "zap"),
            new DefaultCategory("Inventory", "#F59E0B", "package"),
            new DefaultCategory("Marketing", "#EC4899", "megaphone"),
            new DefaultCategory("Other", "#64748B", "tag")
    );

    private final CategoryRepository categoryRepository;

    public void seedDefaults(Business business) {
        for (DefaultCategory def : DEFAULT_CATEGORIES) {
            if (!categoryRepository.existsByBusinessIdAndNameIgnoreCase(business.getId(), def.name())) {
                categoryRepository.save(buildCategory(business, def, true));
            }
        }
    }

    static Map<String, Integer> defaultOrder() {
        return IntStream.range(0, DEFAULT_CATEGORIES.size())
                .boxed()
                .collect(Collectors.toMap(
                        i -> DEFAULT_CATEGORIES.get(i).name().toLowerCase(),
                        i -> i));
    }

    static Comparator<Category> defaultSortComparator() {
        Map<String, Integer> order = defaultOrder();
        return Comparator
                .comparingInt((Category c) -> order.getOrDefault(c.getName().toLowerCase(), Integer.MAX_VALUE))
                .thenComparing(c -> c.getName().toLowerCase());
    }

    private Category buildCategory(Business business, DefaultCategory def, boolean isDefault) {
        return Category.builder()
                .business(business)
                .name(def.name())
                .color(def.color())
                .icon(def.icon())
                .isDefault(isDefault)
                .build();
    }
}

package org.ecommerce.backend.infrastructure.persistence.adapter;

import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.port.DiscountPolicyProvider;
import org.ecommerce.backend.infrastructure.persistence.entity.Discount;
import org.ecommerce.backend.infrastructure.persistence.repository.DiscountRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class JpaDiscountPolicyProvider implements DiscountPolicyProvider {

    private static final String TECNOLOGIA_CATEGORY_NAME = "Tecnologia";

    private final DiscountRepository discountRepository;

    public JpaDiscountPolicyProvider(DiscountRepository discountRepository) {
        this.discountRepository = discountRepository;
    }

    @Override
    public Optional<BigDecimal> findActivePercentageForCategory(CategoryType category) {
        if (category != CategoryType.TECNOLOGIA) {
            return Optional.empty();
        }
        return discountRepository
                .findActiveDiscount(TECNOLOGIA_CATEGORY_NAME, LocalDateTime.now())
                .map(Discount::getPercentage);
    }
}

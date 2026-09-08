package org.ecommerce.backend.domain.port;

import org.ecommerce.backend.domain.model.CategoryType;

import java.math.BigDecimal;
import java.util.Optional;

public interface DiscountPolicyProvider {
    Optional<BigDecimal> findActivePercentageForCategory(CategoryType category);

}

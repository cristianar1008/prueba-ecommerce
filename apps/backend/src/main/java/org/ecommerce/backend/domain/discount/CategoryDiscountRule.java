package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.ecommerce.backend.domain.port.DiscountPolicyProvider;

import java.math.BigDecimal;
import java.util.Optional;

public class CategoryDiscountRule implements DiscountRule {

    private final DiscountPolicyProvider discountPolicyProvider;

    public CategoryDiscountRule(DiscountPolicyProvider discountPolicyProvider) {
        this.discountPolicyProvider = discountPolicyProvider;
    }

    @Override
    public void apply(DiscountContext context) {
        Optional<BigDecimal> percentage =
                discountPolicyProvider.findActivePercentageForCategory(CategoryType.TECNOLOGIA);

        if (percentage.isEmpty()) {
            return;
        }

        BigDecimal technologySubtotal = context.getItems().stream()
                .filter(item -> item.category() == CategoryType.TECNOLOGIA)
                .map(CartItem::lineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        context.setCategoryDiscountAmount(technologySubtotal.multiply(percentage.get()));
    }
}
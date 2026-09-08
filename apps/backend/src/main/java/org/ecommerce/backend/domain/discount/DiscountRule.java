package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.model.DiscountContext;

public interface DiscountRule {
    void apply(DiscountContext context);
}
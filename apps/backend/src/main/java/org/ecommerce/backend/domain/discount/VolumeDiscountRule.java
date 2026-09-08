package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.model.DiscountContext;

import java.math.BigDecimal;

public class VolumeDiscountRule implements DiscountRule {

    private final BigDecimal threshold;
    private final BigDecimal percentage;

    public VolumeDiscountRule(BigDecimal threshold, BigDecimal percentage) {
        this.threshold = threshold;
        this.percentage = percentage;
    }

    @Override
    public void apply(DiscountContext context) {
        BigDecimal subtotalAfterCategory = context.getSubtotalAfterAppliedDiscounts();

        if (subtotalAfterCategory.compareTo(threshold) <= 0) {
            return;
        }
        context.setVolumeDiscountAmount(subtotalAfterCategory.multiply(percentage));
    }
}
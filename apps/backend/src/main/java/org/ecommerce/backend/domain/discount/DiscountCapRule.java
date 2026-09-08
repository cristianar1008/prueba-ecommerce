package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.model.DiscountContext;

import java.math.BigDecimal;

public class DiscountCapRule implements DiscountRule {

    private final BigDecimal capPercentage;

    public DiscountCapRule(BigDecimal capPercentage) {
        this.capPercentage = capPercentage;
    }

    @Override
    public void apply(DiscountContext context) {
        BigDecimal rawTotalDiscount = context.getRawTotalDiscount();
        BigDecimal maxAllowedDiscount = context.getSubtotalOriginal().multiply(capPercentage);

        if (rawTotalDiscount.compareTo(maxAllowedDiscount) > 0) {
            context.closeWithFinalTotal(maxAllowedDiscount, true);
        } else {
            context.closeWithFinalTotal(rawTotalDiscount, false);
        }
    }
}
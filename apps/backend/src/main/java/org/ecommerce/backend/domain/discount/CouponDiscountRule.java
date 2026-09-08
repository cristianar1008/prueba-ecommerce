package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.exception.InvalidCouponException;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.ecommerce.backend.domain.port.CouponPolicyProvider;

import java.math.BigDecimal;
import java.util.Optional;

public class CouponDiscountRule implements DiscountRule {

    private final CouponPolicyProvider couponPolicyProvider;

    public CouponDiscountRule(CouponPolicyProvider couponPolicyProvider) {
        this.couponPolicyProvider = couponPolicyProvider;
    }

    @Override
    public void apply(DiscountContext context) {
        String couponCode = context.getCouponCode();
        if (couponCode == null || couponCode.isBlank()) {
            return;
        }

        Optional<BigDecimal> percentage = couponPolicyProvider.findValidDiscountPercentage(couponCode);
        if (percentage.isEmpty()) {
            throw new InvalidCouponException(couponCode);
        }

        context.setCouponDiscountAmount(context.getSubtotalOriginal().multiply(percentage.get()));
    }
}
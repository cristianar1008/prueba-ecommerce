package org.ecommerce.backend.domain.port;

import java.math.BigDecimal;
import java.util.Optional;

public interface CouponPolicyProvider {
    Optional<BigDecimal> findValidDiscountPercentage(String couponCode);
}
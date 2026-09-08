package org.ecommerce.backend.web.dto;

import java.math.BigDecimal;

public record CheckoutResponse(
        Long orderId,
        BigDecimal subtotalOriginal,
        BigDecimal categoryDiscountAmount,
        BigDecimal volumeDiscountAmount,
        BigDecimal couponDiscountAmount,
        boolean discountCapApplied,
        BigDecimal totalDiscountAmount,
        BigDecimal effectiveDiscountPercentage,
        BigDecimal totalToPay
) {
}

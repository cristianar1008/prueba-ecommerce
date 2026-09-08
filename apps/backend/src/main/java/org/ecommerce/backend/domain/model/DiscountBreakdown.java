package org.ecommerce.backend.domain.model;

import java.math.BigDecimal;

/**
 * Resultado final e inmutable del motor de descuentos, ya con el tope del
 * 35% aplicado. Esto es lo que el checkout persiste (mapeado a Order) y
 * lo que la API devuelve al frontend para el desglose.
 */
public record DiscountBreakdown(
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

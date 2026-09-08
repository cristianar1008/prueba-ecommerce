package org.ecommerce.backend.domain.model;

import java.math.BigDecimal;

/**
 * Item del carrito, tal como lo manda el frontend en el checkout.
 * Objeto de dominio puro (sin JPA): el motor de descuentos trabaja sobre
 * esto, no sobre la entidad Product directamente.
 */
public record CartItem(
        Long productId,
        String productName,
        BigDecimal unitPrice,
        Integer quantity,
        CategoryType category
) {

    public CartItem {
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new IllegalArgumentException("unitPrice debe ser un valor no negativo");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("quantity debe ser mayor a cero");
        }
    }

    public BigDecimal lineSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}

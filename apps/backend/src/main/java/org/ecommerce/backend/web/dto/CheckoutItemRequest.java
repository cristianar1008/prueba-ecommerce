package org.ecommerce.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CheckoutItemRequest(
        @NotNull(message = "productId es obligatorio") Long productId,
        @NotNull(message = "quantity es obligatorio") @Positive(message = "quantity debe ser mayor a cero") Integer quantity
) {
}

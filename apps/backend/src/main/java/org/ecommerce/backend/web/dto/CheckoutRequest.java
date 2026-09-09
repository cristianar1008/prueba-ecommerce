package org.ecommerce.backend.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CheckoutRequest(
        @NotEmpty(message = "items no puede estar vacio") @Valid List<CheckoutItemRequest> items,
        String couponCode
) {
}

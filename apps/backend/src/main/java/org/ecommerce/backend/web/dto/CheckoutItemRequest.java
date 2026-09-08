package org.ecommerce.backend.web.dto;

public record CheckoutItemRequest(Long productId, Integer quantity) {
}

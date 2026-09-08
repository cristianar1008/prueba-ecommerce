package org.ecommerce.backend.web.dto;

import java.util.List;

public record CheckoutRequest(List<CheckoutItemRequest> items, String couponCode) {
}
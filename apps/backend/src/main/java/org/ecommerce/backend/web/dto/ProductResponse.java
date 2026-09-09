package org.ecommerce.backend.web.dto;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        BigDecimal unitPrice,
        Integer stock,
        String categoryName,
        String imageUrl
) {
}
package org.ecommerce.backend.web.dto;

import java.math.BigDecimal;

/**
 * Respuesta de GET /api/coupons/{code}. Siempre HTTP 200: "valid" indica si
 * el codigo existe, esta activo y no vencio (mismo criterio que usa
 * CouponPolicyProvider en el checkout real). Se hace asi -y no con 404/400-
 * a proposito, para que el frontend pueda usarlo como validacion "en vivo"
 * mientras el cliente escribe el cupon, sin tener que tratar un codigo
 * todavia-incompleto o invalido como un error HTTP.
 */
public record CouponValidationResponse(
        String code,
        boolean valid,
        BigDecimal discountPercentage
) {
}

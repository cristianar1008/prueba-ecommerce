package org.ecommerce.backend.application.service;

import org.ecommerce.backend.domain.port.CouponPolicyProvider;
import org.ecommerce.backend.web.dto.CouponValidationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Query de solo lectura sobre la misma politica de cupones que usa el
 * motor de descuentos (CouponPolicyProvider, puerto hexagonal). No
 * duplica la regla de "que es un cupon valido" -la reutiliza- para que
 * este endpoint y el checkout real nunca puedan quedar desincronizados.
 *
 * @Transactional(readOnly = true) es necesario: Coupon.state es una
 * relacion @ManyToOne LAZY, y JpaCouponPolicyProvider la lee
 * (coupon.getState().getName()) para saber si esta ACTIVO. Sin una
 * sesion de Hibernate abierta durante esa lectura, explota con
 * LazyInitializationException -mismo tipo de bug que ya paso una vez
 * con ProductQueryService (ver docs/ia.md)-. checkout() y simulate() no
 * lo sufren porque ya estan dentro de su propio @Transactional.
 */
@Service
public class CouponQueryService {

    private final CouponPolicyProvider couponPolicyProvider;

    public CouponQueryService(CouponPolicyProvider couponPolicyProvider) {
        this.couponPolicyProvider = couponPolicyProvider;
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validate(String code) {
        Optional<BigDecimal> percentage = couponPolicyProvider.findValidDiscountPercentage(code);
        return percentage
                .map(value -> new CouponValidationResponse(code, true, value))
                .orElseGet(() -> new CouponValidationResponse(code, false, null));
    }
}

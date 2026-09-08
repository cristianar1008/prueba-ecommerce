package org.ecommerce.backend.infrastructure.persistence.adapter;

import org.ecommerce.backend.domain.port.CouponPolicyProvider;
import org.ecommerce.backend.infrastructure.persistence.entity.Coupon;
import org.ecommerce.backend.infrastructure.persistence.repository.CouponRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class JpaCouponPolicyProvider implements CouponPolicyProvider {

    private static final String ACTIVE_STATE_NAME = "ACTIVO";

    private final CouponRepository couponRepository;

    public JpaCouponPolicyProvider(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Override
    public Optional<BigDecimal> findValidDiscountPercentage(String couponCode) {
        return couponRepository.findByCodeIgnoreCase(couponCode)
                .filter(coupon -> ACTIVE_STATE_NAME.equalsIgnoreCase(coupon.getState().getName()))
                .filter(coupon -> coupon.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(Coupon::getDiscountPercentage);
    }
}
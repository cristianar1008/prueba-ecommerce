package org.ecommerce.backend.application.factory;

import org.ecommerce.backend.domain.discount.*;
import org.ecommerce.backend.domain.port.CouponPolicyProvider;
import org.ecommerce.backend.domain.port.DiscountPolicyProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DiscountChainFactory {

    private final DiscountPolicyProvider discountPolicyProvider;
    private final CouponPolicyProvider couponPolicyProvider;
    private final BigDecimal volumeThreshold;
    private final BigDecimal volumePercentage;
    private final BigDecimal capPercentage;

    public DiscountChainFactory(
            DiscountPolicyProvider discountPolicyProvider,
            CouponPolicyProvider couponPolicyProvider,
            @Value("${discount.volume.threshold}") BigDecimal volumeThreshold,
            @Value("${discount.volume.percentage}") BigDecimal volumePercentage,
            @Value("${discount.cap.percentage}") BigDecimal capPercentage
    ) {
        this.discountPolicyProvider = discountPolicyProvider;
        this.couponPolicyProvider = couponPolicyProvider;
        this.volumeThreshold = volumeThreshold;
        this.volumePercentage = volumePercentage;
        this.capPercentage = capPercentage;
    }

    public DiscountChain create() {
        return new DiscountChain(List.of(
                new CategoryDiscountRule(discountPolicyProvider),
                new VolumeDiscountRule(volumeThreshold, volumePercentage),
                new CouponDiscountRule(couponPolicyProvider),
                new DiscountCapRule(capPercentage)
        ));
    }
}
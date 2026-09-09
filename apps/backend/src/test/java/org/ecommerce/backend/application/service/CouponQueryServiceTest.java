package org.ecommerce.backend.application.service;

import org.ecommerce.backend.domain.port.CouponPolicyProvider;
import org.ecommerce.backend.web.dto.CouponValidationResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponQueryServiceTest {

    @Mock
    private CouponPolicyProvider couponPolicyProvider;

    @InjectMocks
    private CouponQueryService couponQueryService;

    @Test
    void devuelveValidoConElPorcentajeCuandoElCuponEstaActivo() {
        when(couponPolicyProvider.findValidDiscountPercentage("WELCOME2026"))
                .thenReturn(Optional.of(new BigDecimal("0.15")));

        CouponValidationResponse response = couponQueryService.validate("WELCOME2026");

        assertThat(response.code()).isEqualTo("WELCOME2026");
        assertThat(response.valid()).isTrue();
        assertThat(response.discountPercentage()).isEqualByComparingTo("0.15");
    }

    @Test
    void devuelveInvalidoSinPorcentajeCuandoElCuponNoExisteOEstaVencido() {
        when(couponPolicyProvider.findValidDiscountPercentage("PROMO2020"))
                .thenReturn(Optional.empty());

        CouponValidationResponse response = couponQueryService.validate("PROMO2020");

        assertThat(response.code()).isEqualTo("PROMO2020");
        assertThat(response.valid()).isFalse();
        assertThat(response.discountPercentage()).isNull();
    }
}

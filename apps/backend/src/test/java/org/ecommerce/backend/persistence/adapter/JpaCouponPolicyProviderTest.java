package org.ecommerce.backend.persistence.adapter;

import org.ecommerce.backend.infrastructure.persistence.adapter.JpaCouponPolicyProvider;
import org.ecommerce.backend.infrastructure.persistence.entity.Coupon;
import org.ecommerce.backend.infrastructure.persistence.entity.StateCoupon;
import org.ecommerce.backend.infrastructure.persistence.repository.CouponRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JpaCouponPolicyProviderTest {

    @Mock
    private CouponRepository couponRepository;

    @InjectMocks
    private JpaCouponPolicyProvider jpaCouponPolicyProvider;

    private Coupon cupon(String estado, LocalDateTime expiresAt) {
        StateCoupon stateCoupon = new StateCoupon();
        stateCoupon.setName(estado);

        Coupon coupon = new Coupon();
        coupon.setCode("WELCOME2026");
        coupon.setDiscountPercentage(new BigDecimal("0.15"));
        coupon.setExpiresAt(expiresAt);
        coupon.setState(stateCoupon);
        return coupon;
    }

    @Test
    void devuelveElPorcentajeCuandoElCuponEstaActivoYVigente() {
        when(couponRepository.findByCodeIgnoreCase("WELCOME2026"))
                .thenReturn(Optional.of(cupon("ACTIVO", LocalDateTime.now().plusYears(1))));

        Optional<BigDecimal> resultado = jpaCouponPolicyProvider.findValidDiscountPercentage("WELCOME2026");

        assertThat(resultado).contains(new BigDecimal("0.15"));
    }

    @Test
    void devuelveVacioCuandoElCuponNoExisteEnLaBaseDeDatos() {
        when(couponRepository.findByCodeIgnoreCase("NOEXISTE"))
                .thenReturn(Optional.empty());

        Optional<BigDecimal> resultado = jpaCouponPolicyProvider.findValidDiscountPercentage("NOEXISTE");

        assertThat(resultado).isEmpty();
    }

    @Test
    void devuelveVacioCuandoElCuponYaExpiro() {
        when(couponRepository.findByCodeIgnoreCase("PROMO2020"))
                .thenReturn(Optional.of(cupon("ACTIVO", LocalDateTime.of(2020, 1, 1, 0, 0))));

        Optional<BigDecimal> resultado = jpaCouponPolicyProvider.findValidDiscountPercentage("PROMO2020");

        assertThat(resultado).isEmpty();
    }

    @Test
    void devuelveVacioCuandoElEstadoDelCuponNoEsActivo() {
        when(couponRepository.findByCodeIgnoreCase("BLOQUEADO"))
                .thenReturn(Optional.of(cupon("BLOQUEADO", LocalDateTime.now().plusYears(1))));

        Optional<BigDecimal> resultado = jpaCouponPolicyProvider.findValidDiscountPercentage("BLOQUEADO");

        assertThat(resultado).isEmpty();
    }
}

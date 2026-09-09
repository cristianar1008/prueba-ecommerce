package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.discount.CouponDiscountRule;
import org.ecommerce.backend.domain.exception.InvalidCouponException;
import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.ecommerce.backend.domain.port.CouponPolicyProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponDiscountRuleTest {

    @Mock
    private CouponPolicyProvider couponPolicyProvider;

    private DiscountContext contextWithSubtotal(BigDecimal amount, String couponCode) {
        CartItem item = new CartItem(1L, "Item", amount, 1, CategoryType.OTRO);
        return new DiscountContext(List.of(item), couponCode);
    }

    @Test
    void noAplicaNiConsultaElPuertoCuandoNoHayCodigoDeCupon() {
        DiscountContext context = contextWithSubtotal(new BigDecimal("171.00"), null);

        new CouponDiscountRule(couponPolicyProvider).apply(context);

        assertThat(context.getCouponDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void noAplicaNiConsultaElPuertoCuandoElCodigoEsEnBlanco() {
        DiscountContext context = contextWithSubtotal(new BigDecimal("171.00"), "   ");

        new CouponDiscountRule(couponPolicyProvider).apply(context);

        assertThat(context.getCouponDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void aplicaElPorcentajeSobreElSubtotalRestanteCuandoElCuponEsValido() {
        when(couponPolicyProvider.findValidDiscountPercentage("WELCOME2026"))
                .thenReturn(Optional.of(new BigDecimal("0.15")));

        DiscountContext context = contextWithSubtotal(new BigDecimal("171.00"), "WELCOME2026");

        new CouponDiscountRule(couponPolicyProvider).apply(context);

        assertThat(context.getCouponDiscountAmount()).isEqualByComparingTo("25.65");
    }

    @Test
    void lanzaInvalidCouponExceptionCuandoElCuponNoExisteOEstaExpirado() {
        when(couponPolicyProvider.findValidDiscountPercentage("PROMO2020"))
                .thenReturn(Optional.empty());

        DiscountContext context = contextWithSubtotal(new BigDecimal("171.00"), "PROMO2020");

        assertThatThrownBy(() -> new CouponDiscountRule(couponPolicyProvider).apply(context))
                .isInstanceOf(InvalidCouponException.class)
                .hasMessageContaining("PROMO2020");
    }
}

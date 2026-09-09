package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.discount.CategoryDiscountRule;
import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.ecommerce.backend.domain.port.DiscountPolicyProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryDiscountRuleTest {

    @Mock
    private DiscountPolicyProvider discountPolicyProvider;

    @Test
    void aplicaElDescuentoSoloSobreLosProductosDeTecnologia() {
        when(discountPolicyProvider.findActivePercentageForCategory(CategoryType.TECNOLOGIA))
                .thenReturn(Optional.of(new BigDecimal("0.10")));

        CartItem laptop = new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 1, CategoryType.TECNOLOGIA);
        CartItem silla = new CartItem(2L, "Silla de Oficina", new BigDecimal("90.00"), 1, CategoryType.OTRO);
        DiscountContext context = new DiscountContext(List.of(laptop, silla), null);

        new CategoryDiscountRule(discountPolicyProvider).apply(context);

        // 10% solo sobre los $150 de la laptop, no sobre los $90 de la silla
        assertThat(context.getCategoryDiscountAmount()).isEqualByComparingTo("15.00");
    }

    @Test
    void noAplicaNadaSiNoHayDescuentoActivoParaLaCategoria() {
        when(discountPolicyProvider.findActivePercentageForCategory(CategoryType.TECNOLOGIA))
                .thenReturn(Optional.empty());

        CartItem laptop = new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 1, CategoryType.TECNOLOGIA);
        DiscountContext context = new DiscountContext(List.of(laptop), null);

        new CategoryDiscountRule(discountPolicyProvider).apply(context);

        assertThat(context.getCategoryDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void noAplicaNadaSiElCarritoNoTieneProductosDeTecnologia() {
        when(discountPolicyProvider.findActivePercentageForCategory(CategoryType.TECNOLOGIA))
                .thenReturn(Optional.of(new BigDecimal("0.10")));

        CartItem silla = new CartItem(2L, "Silla de Oficina", new BigDecimal("90.00"), 1, CategoryType.OTRO);
        DiscountContext context = new DiscountContext(List.of(silla), null);

        new CategoryDiscountRule(discountPolicyProvider).apply(context);

        assertThat(context.getCategoryDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
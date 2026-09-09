package org.ecommerce.backend.domain.model;

import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiscountContextTest {

    private CartItem laptop() {
        return new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 1, CategoryType.TECNOLOGIA);
    }

    private CartItem mouse() {
        return new CartItem(2L, "Mouse Inalambrico", new BigDecimal("50.00"), 1, CategoryType.TECNOLOGIA);
    }

    @Test
    void rechazaListaDeItemsNula() {
        assertThatThrownBy(() -> new DiscountContext(null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rechazaListaDeItemsVacia() {
        assertThatThrownBy(() -> new DiscountContext(List.of(), null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void calculaElSubtotalOriginalSumandoTodasLasLineas() {
        DiscountContext context = new DiscountContext(List.of(laptop(), mouse()), null);

        assertThat(context.getSubtotalOriginal()).isEqualByComparingTo("200.00");
    }

    @Test
    void getSubtotalAfterAppliedDiscountsRestaLosDescuentosYaAplicados() {
        DiscountContext context = new DiscountContext(List.of(laptop(), mouse()), null);

        context.setCategoryDiscountAmount(new BigDecimal("20.00"));
        assertThat(context.getSubtotalAfterAppliedDiscounts()).isEqualByComparingTo("180.00");

        context.setVolumeDiscountAmount(new BigDecimal("9.00"));
        assertThat(context.getSubtotalAfterAppliedDiscounts()).isEqualByComparingTo("171.00");
    }

    @Test
    void closeWithFinalTotalCalculaPorcentajeEfectivoYTotalAPagar() {
        DiscountContext context = new DiscountContext(List.of(laptop(), mouse()), "WELCOME2026");

        context.closeWithFinalTotal(new BigDecimal("54.65"), false);

        assertThat(context.isDiscountCapApplied()).isFalse();
        assertThat(context.toBreakdown().totalToPay()).isEqualByComparingTo("145.35");
        assertThat(context.toBreakdown().effectiveDiscountPercentage()).isEqualByComparingTo("0.2733");
    }

    @Test
    void toBreakdownFallaSiElContextoNoHaSidoCerrado() {
        DiscountContext context = new DiscountContext(List.of(laptop()), null);

        assertThatThrownBy(context::toBreakdown)
                .isInstanceOf(IllegalStateException.class);
    }
}
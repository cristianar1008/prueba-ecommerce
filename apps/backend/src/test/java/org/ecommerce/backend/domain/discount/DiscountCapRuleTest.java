package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.discount.DiscountCapRule;
import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DiscountCapRuleTest {

    private static final BigDecimal CAP = new BigDecimal("0.35");

    private DiscountContext contextConSubtotal(String subtotal) {
        CartItem item = new CartItem(1L, "Item", new BigDecimal(subtotal), 1, CategoryType.TECNOLOGIA);
        return new DiscountContext(List.of(item), null);
    }

    @Test
    void noTruncaCuandoElDescuentoAcumuladoEsMenorAl35PorCiento() {
        DiscountContext context = contextConSubtotal("200.00");
        context.setCategoryDiscountAmount(new BigDecimal("54.65")); // 27.325% de 200

        new DiscountCapRule(CAP).apply(context);

        assertThat(context.isDiscountCapApplied()).isFalse();
        assertThat(context.toBreakdown().totalDiscountAmount()).isEqualByComparingTo("54.65");
    }

    @Test
    void noTruncaCuandoElDescuentoEsExactamenteIgualAl35PorCiento() {
        // Caso de borde obligatorio: exactamente 35% NO cuenta como "superar" el limite
        DiscountContext context = contextConSubtotal("200.00");
        context.setCategoryDiscountAmount(new BigDecimal("70.00")); // exactamente 35% de 200

        new DiscountCapRule(CAP).apply(context);

        assertThat(context.isDiscountCapApplied()).isFalse();
        assertThat(context.toBreakdown().totalDiscountAmount()).isEqualByComparingTo("70.00");
    }

    @Test
    void truncaExactamenteEn35PorCientoCuandoElDescuentoAcumuladoLoSupera() {
        DiscountContext context = contextConSubtotal("200.00");
        context.setCategoryDiscountAmount(new BigDecimal("50.00"));
        context.setVolumeDiscountAmount(new BigDecimal("20.00"));
        context.setCouponDiscountAmount(new BigDecimal("10.00")); // total crudo: 80.00 (40%)

        new DiscountCapRule(CAP).apply(context);

        assertThat(context.isDiscountCapApplied()).isTrue();
        assertThat(context.toBreakdown().totalDiscountAmount()).isEqualByComparingTo("70.00"); // 35% de 200
        assertThat(context.toBreakdown().totalToPay()).isEqualByComparingTo("130.00");
    }
}

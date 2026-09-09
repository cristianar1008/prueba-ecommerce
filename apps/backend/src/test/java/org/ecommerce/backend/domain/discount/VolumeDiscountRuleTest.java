package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.discount.VolumeDiscountRule;
import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VolumeDiscountRuleTest {

    private static final BigDecimal THRESHOLD = new BigDecimal("100");
    private static final BigDecimal PERCENTAGE = new BigDecimal("0.05");

    @Test
    void aplicaSobreElSubtotalRestanteDespuesDeCategoriaCuandoSuperaElUmbral() {
        CartItem laptop = new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 1, CategoryType.TECNOLOGIA);
        DiscountContext context = new DiscountContext(List.of(laptop), null);
        context.setCategoryDiscountAmount(new BigDecimal("15.00")); // queda 135.00, > 100

        new VolumeDiscountRule(THRESHOLD, PERCENTAGE).apply(context);

        assertThat(context.getVolumeDiscountAmount()).isEqualByComparingTo("6.75"); // 5% de 135.00
    }

    @Test
    void noAplicaCuandoElSubtotalRestanteEsMenorOIgualAlUmbral() {
        CartItem mouse = new CartItem(2L, "Mouse", new BigDecimal("50.00"), 1, CategoryType.TECNOLOGIA);
        DiscountContext context = new DiscountContext(List.of(mouse), null);
        context.setCategoryDiscountAmount(new BigDecimal("5.00")); // queda 45.00, <= 100

        new VolumeDiscountRule(THRESHOLD, PERCENTAGE).apply(context);

        assertThat(context.getVolumeDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void noAplicaCuandoElSubtotalRestanteEsExactamenteIgualAlUmbral() {
        CartItem item = new CartItem(1L, "Producto", new BigDecimal("100.00"), 1, CategoryType.OTRO);
        DiscountContext context = new DiscountContext(List.of(item), null);
        // sin descuento de categoria, queda exactamente 100.00

        new VolumeDiscountRule(THRESHOLD, PERCENTAGE).apply(context);

        assertThat(context.getVolumeDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}

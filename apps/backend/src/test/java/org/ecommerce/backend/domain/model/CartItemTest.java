package org.ecommerce.backend.domain.model;

import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CartItemTest {

    @Test
    void calculaElSubtotalDeLaLineaMultiplicandoPrecioPorCantidad() {
        CartItem item = new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 2, CategoryType.TECNOLOGIA);

        assertThat(item.lineSubtotal()).isEqualByComparingTo("300.00");
    }

    @Test
    void rechazaPrecioUnitarioNegativo() {
        assertThatThrownBy(() ->
                new CartItem(1L, "Laptop X1", new BigDecimal("-10.00"), 1, CategoryType.TECNOLOGIA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aceptaPrecioUnitarioCero() {
        CartItem item = new CartItem(1L, "Muestra Gratis", BigDecimal.ZERO, 1, CategoryType.OTRO);

        assertThat(item.lineSubtotal()).isEqualByComparingTo("0.00");
    }

    @Test
    void rechazaCantidadCero() {
        assertThatThrownBy(() ->
                new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), 0, CategoryType.TECNOLOGIA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rechazaCantidadNegativa() {
        assertThatThrownBy(() ->
                new CartItem(1L, "Laptop X1", new BigDecimal("150.00"), -3, CategoryType.TECNOLOGIA))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
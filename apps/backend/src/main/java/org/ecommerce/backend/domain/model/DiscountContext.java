package org.ecommerce.backend.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Acumulador mutable que viaja a traves de la cadena de reglas de descuento
 * (Chain of Responsibility). Cada DiscountRule lee/escribe aqui su parte;
 * al final, DiscountCapRule cierra el calculo aplicando el tope del 35% y
 * el contexto se convierte en un DiscountBreakdown inmutable.
 *
 * Deliberadamente sin Lombok/Spring/JPA: es dominio puro.
 */
public class DiscountContext {

    private final List<CartItem> items;
    private final String couponCode;
    private final BigDecimal subtotalOriginal;

    private BigDecimal categoryDiscountAmount = BigDecimal.ZERO;
    private BigDecimal volumeDiscountAmount = BigDecimal.ZERO;
    private BigDecimal couponDiscountAmount = BigDecimal.ZERO;

    private boolean discountCapApplied = false;
    private BigDecimal totalDiscountAmount;
    private BigDecimal effectiveDiscountPercentage;
    private BigDecimal totalToPay;

    public DiscountContext(List<CartItem> items, String couponCode) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("El carrito no puede estar vacio");
        }
        this.items = List.copyOf(items);
        this.couponCode = couponCode;
        this.subtotalOriginal = this.items.stream()
                .map(CartItem::lineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<CartItem> getItems() {
        return items;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public BigDecimal getSubtotalOriginal() {
        return subtotalOriginal;
    }

    public BigDecimal getCategoryDiscountAmount() {
        return categoryDiscountAmount;
    }

    public void setCategoryDiscountAmount(BigDecimal amount) {
        this.categoryDiscountAmount = amount;
    }

    public BigDecimal getVolumeDiscountAmount() {
        return volumeDiscountAmount;
    }

    public void setVolumeDiscountAmount(BigDecimal amount) {
        this.volumeDiscountAmount = amount;
    }

    public BigDecimal getCouponDiscountAmount() {
        return couponDiscountAmount;
    }

    public void setCouponDiscountAmount(BigDecimal amount) {
        this.couponDiscountAmount = amount;
    }

    /** Suma cruda de las 3 bolsas de descuento, antes de aplicar el tope del 35%. */
    public BigDecimal getRawTotalDiscount() {
        return categoryDiscountAmount.add(volumeDiscountAmount).add(couponDiscountAmount);
    }

    public boolean isDiscountCapApplied() {
        return discountCapApplied;
    }

    /**
     * Cierra el calculo: fija el total final (ya topado si aplicaba), marca
     * si el tope se activo, y deriva porcentaje efectivo + total a pagar.
     * Debe ser llamado exactamente una vez, por DiscountCapRule, al final de la cadena.
     */
    public void closeWithFinalTotal(BigDecimal finalTotalDiscount, boolean capApplied) {
        this.totalDiscountAmount = finalTotalDiscount;
        this.discountCapApplied = capApplied;
        this.effectiveDiscountPercentage = subtotalOriginal.signum() == 0
                ? BigDecimal.ZERO
                : finalTotalDiscount.divide(subtotalOriginal, 4, RoundingMode.HALF_UP);
        this.totalToPay = subtotalOriginal.subtract(finalTotalDiscount);
    }

    public DiscountBreakdown toBreakdown() {
        if (totalDiscountAmount == null) {
            throw new IllegalStateException("El contexto aun no fue cerrado (falta DiscountCapRule)");
        }
        return new DiscountBreakdown(
                subtotalOriginal,
                categoryDiscountAmount,
                volumeDiscountAmount,
                couponDiscountAmount,
                discountCapApplied,
                totalDiscountAmount,
                effectiveDiscountPercentage,
                totalToPay
        );
    }
}

package org.ecommerce.backend.infrastructure.persistence.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tabla se llama "orders" (no "order") porque ORDER es palabra reservada en SQL.
 * Guarda el desglose completo de descuentos ya calculado y persistido, tal
 * como lo exige la prueba: totales exactos, no recalculables despues.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Nullable: una orden puede no haber usado cupon.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_coupon")
    private Coupon coupon;

    @Column(name = "subtotal_original", nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotalOriginal;

    @Column(name = "category_discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal categoryDiscountAmount;

    @Column(name = "volume_discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal volumeDiscountAmount;

    @Column(name = "coupon_discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal couponDiscountAmount;

    @Column(name = "discount_cap_applied", nullable = false)
    private Boolean discountCapApplied;

    @Column(name = "total_discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalDiscountAmount;

    @Column(name = "effective_discount_percentage", nullable = false, precision = 5, scale = 4)
    private BigDecimal effectiveDiscountPercentage;

    @Column(name = "total_to_pay", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalToPay;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}

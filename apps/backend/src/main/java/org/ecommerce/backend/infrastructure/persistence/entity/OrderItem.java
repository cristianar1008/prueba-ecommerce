package org.ecommerce.backend.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.ecommerce.backend.domain.model.CategoryType;

/**
 * Linea de orden. Guarda "fotos" (snapshot) de producto/precio/categoria en
 * el momento de la compra, independientes de que Product/Discount cambien
 * despues -- asi el historico de una orden nunca se altera retroactivamente.
 */
@Entity
@Table(name = "order_item")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_name_snapshot", nullable = false)
    private String productNameSnapshot;

    @Column(name = "unit_price_snapshot", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPriceSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_snapshot", nullable = false)
    private CategoryType categorySnapshot;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_subtotal", nullable = false, precision = 19, scale = 2)
    private BigDecimal lineSubtotal;

    // Nullable: la linea puede no haber tenido descuento por categoria aplicable.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id")
    private Discount discount;

    @Column(name = "line_discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal lineDiscountAmount;
}

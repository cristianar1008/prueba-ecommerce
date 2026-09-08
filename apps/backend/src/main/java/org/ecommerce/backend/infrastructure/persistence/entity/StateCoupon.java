package org.ecommerce.backend.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Catalogo de estados posibles de un cupon (ej. ACTIVO, EXPIRADO, USADO).
 * Tabla en vez de Enum para poder agregar/editar estados sin desplegar codigo.
 */
@Entity
@Table(name = "state_coupon")
@Getter
@Setter
@NoArgsConstructor
public class StateCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}

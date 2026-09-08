package org.ecommerce.backend.domain.model;

/**
 * Tipo de categoria "congelado" para el snapshot historico de OrderItem.
 * Se mantiene separado de la entidad Category (que es dinamica en BD)
 * porque la regla de negocio del 10% solo distingue Tecnologia vs el resto,
 * y el snapshot no debe depender de que la fila de Category siga existiendo.
 */
public enum CategoryType {
    TECNOLOGIA,
    OTRO
}

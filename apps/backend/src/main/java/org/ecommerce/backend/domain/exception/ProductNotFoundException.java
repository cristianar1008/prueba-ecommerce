package org.ecommerce.backend.domain.exception;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long productId) {
        super("Producto no encontrado con id: " + productId);
    }
}
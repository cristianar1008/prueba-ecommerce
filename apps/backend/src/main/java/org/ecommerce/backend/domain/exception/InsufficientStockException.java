package org.ecommerce.backend.domain.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(Long productId, int requested, int available) {
        super("Stock insuficiente para el producto " + productId
                + ": solicitado " + requested + ", disponible " + available);
    }
}
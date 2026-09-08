package org.ecommerce.backend.domain.exception;

public class EmptyCartException extends RuntimeException {

    public EmptyCartException() {
        super("El carrito no puede estar vacio");
    }
}
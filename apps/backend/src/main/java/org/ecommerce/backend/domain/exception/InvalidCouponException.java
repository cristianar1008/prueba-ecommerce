package org.ecommerce.backend.domain.exception;

public class InvalidCouponException extends RuntimeException {

    public InvalidCouponException(String couponCode) {
        super("El cupon '" + couponCode + "' no es valido o ha expirado");
    }
}
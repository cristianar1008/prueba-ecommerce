package org.ecommerce.backend.web.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica las anotaciones de Bean Validation en CheckoutRequest /
 * CheckoutItemRequest directamente con el Validator de Jakarta, sin
 * levantar contexto de Spring ni MockMvc: es exactamente lo mismo que
 * dispara @Valid en CheckoutController antes de que la request llegue a
 * CheckoutService, pero como test unitario puro y rapido.
 */
class CheckoutRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void rechazaCarritoConItemsVacio() {
        CheckoutRequest request = new CheckoutRequest(List.of(), null);

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("items"));
    }

    @Test
    void rechazaCantidadNoPositiva() {
        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 0)), null);

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().contains("quantity"));
    }

    @Test
    void rechazaProductIdNulo() {
        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(null, 2)), null);

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().contains("productId"));
    }

    @Test
    void aceptaUnCheckoutRequestValido() {
        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 2)), "WELCOME2026");

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }
}

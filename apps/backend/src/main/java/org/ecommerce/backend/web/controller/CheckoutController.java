package org.ecommerce.backend.web.controller;

import org.ecommerce.backend.application.service.CheckoutService;
import org.ecommerce.backend.web.dto.CheckoutRequest;
import org.ecommerce.backend.web.dto.CheckoutResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.checkout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Simulacion de solo lectura: mismo request/response que el checkout
     * real, pero no bloquea ni decrementa stock y no persiste ninguna
     * Order. Pensado para el carrito del frontend: "Ir a pagar" dispara
     * esto para mostrar el desglose de descuentos antes de que el cliente
     * confirme la compra de verdad con POST /api/checkout.
     */
    @PostMapping("/simulate")
    public ResponseEntity<CheckoutResponse> simulate(@RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.simulate(request);
        return ResponseEntity.ok(response);
    }
}

import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ShopFacadeService } from '../../core/services/shop-facade.service';

/**
 * Carrito como drawer lateral (no como panel fijo): se abre con el ícono
 * del topbar y se cierra al hacer click afuera, en la X o al ir a pagar.
 * Solo muestra el subtotal SIN descuentos (HU1) -- los descuentos recién
 * se calculan al entrar a la vista de checkout.
 */
@Component({
  selector: 'app-cart',
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private readonly shop = inject(ShopFacadeService);

  readonly open$ = this.shop.cartOpen$;
  readonly lines$ = this.shop.cartLines$;
  readonly subtotal$ = this.shop.subtotal$;

  increment(productId: number): void {
    this.shop.incrementFromCart(productId);
  }

  decrement(productId: number): void {
    this.shop.decrementFromCart(productId);
  }

  remove(productId: number): void {
    this.shop.removeFromCart(productId);
  }

  close(): void {
    this.shop.closeCart();
  }

  goToCheckout(): void {
    this.shop.goToCheckout();
  }
}

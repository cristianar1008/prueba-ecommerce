import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ShopFacadeService } from '../../core/services/shop-facade.service';

@Component({
  selector: 'app-cart',
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private readonly shop = inject(ShopFacadeService);

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
}

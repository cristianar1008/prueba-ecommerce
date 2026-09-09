import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Catalog } from './features/catalog/catalog';
import { Cart } from './features/cart/cart';
import { Checkout } from './features/checkout/checkout';
import { DiscountAlert } from './shared/discount-alert/discount-alert';
import { ShopFacadeService } from './core/services/shop-facade.service';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, Catalog, Cart, Checkout, DiscountAlert],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly shop = inject(ShopFacadeService);

  protected readonly title = 'Core E-Commerce · Descuentos Acumulativos';

  readonly itemCount$ = this.shop.itemCount$;
  readonly view$ = this.shop.view$;

  toggleCart(): void {
    this.shop.toggleCart();
  }
}

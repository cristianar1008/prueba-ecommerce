import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopFacadeService } from '../../core/services/shop-facade.service';

@Component({
  selector: 'app-checkout',
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly shop = inject(ShopFacadeService);

  readonly loading$ = this.shop.loading$;
  readonly error$ = this.shop.error$;
  readonly result$ = this.shop.checkoutResult$;

  couponCode = signal('');

  confirm(): void {
    this.shop.checkout(this.couponCode().trim() || null);
  }
}

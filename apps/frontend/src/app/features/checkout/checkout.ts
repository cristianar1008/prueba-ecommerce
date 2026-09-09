import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { CouponValidationView } from '../../core/models/coupon-validation.model';

/**
 * Vista de checkout (HU2): a esta vista se llega desde "Ir a pagar" en el
 * carrito. La validación del cupón es EXPLÍCITA (botón "Validar"), no
 * reactiva por cada tecla: si se disparara sola con debounce, cualquiera
 * podría usar el campo como un oráculo para ir probando códigos hasta
 * adivinar uno válido. Con un botón, cada intento es una acción deliberada
 * del cliente. Al validar, si el cupón es válido se recalcula el desglose
 * en vivo contra POST /api/checkout/simulate (sin tocar stock ni
 * persistir nada). La compra solo se confirma de verdad al hacer click en
 * "Pagar".
 */
@Component({
  selector: 'app-checkout',
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly shop = inject(ShopFacadeService);

  readonly cartLines$ = this.shop.cartLines$;
  readonly simulation$ = this.shop.simulation$;
  readonly simulationLoading$ = this.shop.simulationLoading$;
  readonly confirming$ = this.shop.loading$;
  readonly error$ = this.shop.error$;
  readonly confirmedResult$ = this.shop.checkoutResult$;

  couponCode = signal('');
  couponStatus = signal<CouponValidationView | null>(null);
  couponChecking = signal(false);

  /** El único código que "Pagar" puede usar: el que de verdad pasó por Validar. */
  private readonly validatedCouponCode = signal<string | null>(null);

  onCouponInput(value: string): void {
    this.couponCode.set(value);
    // Si el cliente toca el campo después de haber validado, esa
    // validación queda obsoleta: hay que invalidarla para que "Pagar" no
    // aplique un código que ya no coincide con lo que está escrito.
    if (this.couponStatus() !== null) {
      this.couponStatus.set(null);
      this.validatedCouponCode.set(null);
      this.shop.simulate(null);
    }
  }

  validateCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      return;
    }

    this.couponChecking.set(true);
    this.shop.validateCoupon(code).subscribe((validation) => {
      this.couponChecking.set(false);
      this.couponStatus.set(validation);

      if (validation.checkFailed) {
        return; // no tocar la simulación: puede ser solo un hipo de red
      }
      this.validatedCouponCode.set(validation.valid ? code : null);
      this.shop.simulate(validation.valid ? code : null);
    });
  }

  back(): void {
    this.shop.backToCatalog();
  }

  pay(): void {
    this.shop.checkout(this.validatedCouponCode());
  }
}

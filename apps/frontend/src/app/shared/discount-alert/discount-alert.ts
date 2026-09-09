import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ShopFacadeService } from '../../core/services/shop-facade.service';

/**
 * HU4: notificación visual persistente y distintiva cuando el checkout
 * llega al tope del 35%. "Persistente" = no desaparece sola (no hay
 * timeout); solo se oculta si el usuario la cierra o si un nuevo checkout
 * llega sin tope aplicado.
 */
@Component({
  selector: 'app-discount-alert',
  templateUrl: './discount-alert.html',
  styleUrl: './discount-alert.css',
})
export class DiscountAlert {
  private readonly shop = inject(ShopFacadeService);
  private readonly checkoutResult = toSignal(this.shop.checkoutResult$, { initialValue: null });

  readonly visible = signal(false);

  constructor() {
    effect(() => {
      const result = this.checkoutResult();
      this.visible.set(!!result?.discountCapApplied);
    });
  }

  dismiss(): void {
    this.visible.set(false);
  }
}

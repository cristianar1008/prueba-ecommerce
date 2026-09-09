import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { toCheckoutRequestDto, toDiscountBreakdownView } from '../mappers/checkout.mapper';
import { toProduct } from '../mappers/product.mapper';
import { ApiErrorDto } from '../models/api/checkout.dto';
import { DiscountBreakdownView } from '../models/discount-breakdown.model';
import { CartLine, Product } from '../models/product.model';
import { CartStateService } from './cart-state.service';
import { CheckoutApiService } from './checkout-api.service';
import { ProductApiService } from './product-api.service';

/**
 * Fachada: el único punto de entrada que ven los componentes de
 * features/*. Por dentro coordina 3 piezas (ProductApiService,
 * CheckoutApiService, CartStateService) para que ningún componente tenga
 * que conocerlas ni inyectarlas por separado. Si mañana cambia cómo se
 * pide el catálogo o cómo se llama al checkout, los componentes no se
 * enteran — solo cambia esta clase.
 */
@Injectable({ providedIn: 'root' })
export class ShopFacadeService {
  private readonly productApi = inject(ProductApiService);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly cartState = inject(CartStateService);

  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$: Observable<Product[]> = this.productsSubject.asObservable();

  readonly cartLines$: Observable<CartLine[]> = this.cartState.lines$;
  readonly subtotal$: Observable<number> = this.cartState.subtotal$;
  readonly itemCount$: Observable<number> = this.cartState.itemCount$;

  private readonly checkoutResultSubject = new BehaviorSubject<DiscountBreakdownView | null>(null);
  readonly checkoutResult$: Observable<DiscountBreakdownView | null> = this.checkoutResultSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  loadProducts(): void {
    this.productApi.getAll().subscribe({
      next: (dtos) => this.productsSubject.next(dtos.map(toProduct)),
      error: () => this.errorSubject.next('No se pudo cargar el catálogo de productos.'),
    });
  }

  addToCart(product: Product): void {
    this.cartState.add(product);
  }

  /** Reutiliza add(): CartStateService ya valida que no se exceda el stock. */
  incrementFromCart(productId: number): void {
    const line = this.cartState.getSnapshot().find((l) => l.product.id === productId);
    if (line) {
      this.cartState.add(line.product);
    }
  }

  decrementFromCart(productId: number): void {
    this.cartState.decrement(productId);
  }

  removeFromCart(productId: number): void {
    this.cartState.remove(productId);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  checkout(couponCode: string | null): void {
    const lines = this.cartState.getSnapshot();
    if (lines.length === 0) {
      this.errorSubject.next('El carrito está vacío.');
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    const request = toCheckoutRequestDto(lines, couponCode);

    this.checkoutApi.checkout(request).subscribe({
      next: (dto) => {
        this.checkoutResultSubject.next(toDiscountBreakdownView(dto));
        this.cartState.clear();
        this.loadingSubject.next(false);
        this.loadProducts(); // refresca stock tras decrementarlo en el backend
      },
      error: (err: HttpErrorResponse) => {
        this.errorSubject.next(this.extractMessage(err));
        this.loadingSubject.next(false);
      },
    });
  }

  private extractMessage(err: HttpErrorResponse): string {
    const body = err.error as ApiErrorDto | undefined;
    return body?.message ?? 'Ocurrió un error inesperado al procesar el checkout.';
  }
}

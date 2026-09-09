import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { toCheckoutRequestDto, toDiscountBreakdownView } from '../mappers/checkout.mapper';
import { toCouponValidationView } from '../mappers/coupon.mapper';
import { toProduct } from '../mappers/product.mapper';
import { ApiErrorDto } from '../models/api/checkout.dto';
import { CouponValidationView } from '../models/coupon-validation.model';
import { DiscountBreakdownView } from '../models/discount-breakdown.model';
import { CartLine, Product } from '../models/product.model';
import { CartStateService } from './cart-state.service';
import { CheckoutApiService } from './checkout-api.service';
import { CouponApiService } from './coupon-api.service';
import { ProductApiService } from './product-api.service';

export type ShopView = 'catalog' | 'checkout';

/**
 * Fachada: el único punto de entrada que ven los componentes de
 * features/*. Por dentro coordina ProductApiService, CheckoutApiService,
 * CouponApiService y CartStateService, más el estado de navegación
 * (drawer del carrito / vista activa), para que ningún componente tenga
 * que conocerlos ni inyectarlos por separado.
 *
 * Flujo de compra: el carrito es un drawer (cartOpen$) que solo calcula el
 * subtotal SIN descuentos (HU1, 100% local, vía CartStateService). Al
 * hacer click en "Ir a pagar" se navega a la vista de checkout (view$) y
 * recién ahí se dispara simulate() -POST /api/checkout/simulate, de solo
 * lectura- para mostrar el desglose con descuentos en vivo. La compra
 * solo se confirma de verdad (decrementa stock, persiste la orden) cuando
 * el cliente hace click en "Pagar", que llama a checkout() -POST
 * /api/checkout-.
 */
@Injectable({ providedIn: 'root' })
export class ShopFacadeService {
  private readonly productApi = inject(ProductApiService);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly couponApi = inject(CouponApiService);
  private readonly cartState = inject(CartStateService);

  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$: Observable<Product[]> = this.productsSubject.asObservable();

  readonly cartLines$: Observable<CartLine[]> = this.cartState.lines$;
  readonly subtotal$: Observable<number> = this.cartState.subtotal$;
  readonly itemCount$: Observable<number> = this.cartState.itemCount$;

  private readonly cartOpenSubject = new BehaviorSubject<boolean>(false);
  readonly cartOpen$: Observable<boolean> = this.cartOpenSubject.asObservable();

  private readonly viewSubject = new BehaviorSubject<ShopView>('catalog');
  readonly view$: Observable<ShopView> = this.viewSubject.asObservable();

  /** Desglose EN VIVO (previsualización, antes de pagar). Lo llena simulate(). */
  private readonly simulationSubject = new BehaviorSubject<DiscountBreakdownView | null>(null);
  readonly simulation$: Observable<DiscountBreakdownView | null> = this.simulationSubject.asObservable();

  private readonly simulationLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly simulationLoading$: Observable<boolean> = this.simulationLoadingSubject.asObservable();

  /** Desglose de la compra YA CONFIRMADA (post-pago). Lo llena checkout(). */
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

  // ---- Drawer del carrito ----

  toggleCart(): void {
    this.cartOpenSubject.next(!this.cartOpenSubject.value);
  }

  openCart(): void {
    this.cartOpenSubject.next(true);
  }

  closeCart(): void {
    this.cartOpenSubject.next(false);
  }

  // ---- Navegación catálogo <-> checkout ----

  /** "Ir a pagar": cierra el drawer, cambia de vista y dispara el primer simulate() sin cupón. */
  goToCheckout(): void {
    if (this.cartState.getSnapshot().length === 0) {
      this.errorSubject.next('El carrito está vacío.');
      return;
    }
    this.errorSubject.next(null);
    this.checkoutResultSubject.next(null);
    this.cartOpenSubject.next(false);
    this.viewSubject.next('checkout');
    this.simulate(null);
  }

  backToCatalog(): void {
    this.viewSubject.next('catalog');
    this.simulationSubject.next(null);
    this.checkoutResultSubject.next(null);
  }

  // ---- Cupón: validación en vivo (GET /api/coupons/{code}) ----

  /**
   * Passthrough a GET /api/coupons/{code}, ya mapeado a la vista de UI.
   * No toca ningún estado compartido: quien la llama (el componente de
   * checkout) arma su propio pipeline reactivo (debounce + switchMap)
   * sobre esto, porque es una interacción de campo, no un dato global de
   * la tienda. Si la llamada falla, resuelve a "inválido" en vez de
   * romper el stream del componente.
   */
  validateCoupon(code: string): Observable<CouponValidationView> {
    return this.couponApi.validate(code).pipe(
      map(toCouponValidationView),
      catchError(() =>
        of<CouponValidationView>({ code, valid: false, discountPercentage: null, checkFailed: true })
      )
    );
  }

  // ---- Simulación (POST /api/checkout/simulate): previsualizar antes de pagar ----

  simulate(couponCode: string | null): void {
    const lines = this.cartState.getSnapshot();
    if (lines.length === 0) {
      this.simulationSubject.next(null);
      return;
    }

    this.simulationLoadingSubject.next(true);
    const request = toCheckoutRequestDto(lines, couponCode);

    this.checkoutApi.simulate(request).subscribe({
      next: (dto) => {
        this.simulationSubject.next(toDiscountBreakdownView(dto));
        this.simulationLoadingSubject.next(false);
      },
      error: () => {
        this.simulationSubject.next(null);
        this.simulationLoadingSubject.next(false);
      },
    });
  }

  // ---- Compra real (POST /api/checkout): confirma, decrementa stock y persiste ----

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
        this.simulationSubject.next(null);
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

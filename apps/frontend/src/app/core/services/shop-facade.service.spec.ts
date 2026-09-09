import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopFacadeService } from './shop-facade.service';
import { ProductApiService } from './product-api.service';
import { CheckoutApiService } from './checkout-api.service';
import { CouponApiService } from './coupon-api.service';
import { ProductResponseDto } from '../models/api/product-response.dto';
import { CheckoutResponseDto } from '../models/api/checkout.dto';
import { CouponValidationResponseDto } from '../models/api/coupon-validation.dto';
import { DiscountBreakdownView } from '../models/discount-breakdown.model';

function productDto(overrides: Partial<ProductResponseDto> = {}): ProductResponseDto {
  return {
    id: 1,
    name: 'Laptop X1',
    unitPrice: 150,
    stock: 10,
    categoryName: 'Tecnologia',
    imageUrl: 'https://example.com/laptop.png',
    ...overrides,
  };
}

function checkoutResponseDto(overrides: Partial<CheckoutResponseDto> = {}): CheckoutResponseDto {
  return {
    orderId: 500,
    subtotalOriginal: 150,
    categoryDiscountAmount: 0,
    volumeDiscountAmount: 0,
    couponDiscountAmount: 0,
    discountCapApplied: false,
    totalDiscountAmount: 0,
    effectiveDiscountPercentage: 0,
    totalToPay: 150,
    ...overrides,
  };
}

function couponDto(overrides: Partial<CouponValidationResponseDto> = {}): CouponValidationResponseDto {
  return { code: 'WELCOME2026', valid: true, discountPercentage: 0.15, ...overrides };
}

describe('ShopFacadeService', () => {
  let facade: ShopFacadeService;

  function setup(
    getAllImpl: () => any,
    checkoutImpl: () => any,
    simulateImpl: () => any = () => of(checkoutResponseDto()),
    validateImpl: () => any = () => of(couponDto())
  ) {
    const productApi = { getAll: getAllImpl };
    const checkoutApi = { checkout: checkoutImpl, simulate: simulateImpl };
    const couponApi = { validate: validateImpl };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProductApiService, useValue: productApi },
        { provide: CheckoutApiService, useValue: checkoutApi },
        { provide: CouponApiService, useValue: couponApi },
      ],
    });

    facade = TestBed.inject(ShopFacadeService);
  }

  it('loadProducts() mapea los DTOs y los publica en products$', () => {
    setup(
      () => of([productDto({ id: 1 }), productDto({ id: 2, imageUrl: null })]),
      () => of(checkoutResponseDto())
    );

    let products: unknown;
    facade.products$.subscribe((value) => (products = value));

    facade.loadProducts();

    expect(products).toEqual([
      expect.objectContaining({ id: 1, imageUrl: 'https://example.com/laptop.png' }),
      expect.objectContaining({ id: 2 }),
    ]);
  });

  it('loadProducts() publica un mensaje de error si la API falla', () => {
    setup(
      () => throwError(() => new HttpErrorResponse({ status: 500 })),
      () => of(checkoutResponseDto())
    );

    let error: string | null = null;
    facade.error$.subscribe((value) => (error = value));

    facade.loadProducts();

    expect(error).toContain('catálogo');
  });

  it('checkout() con el carrito vacío no llama a la API y marca error', () => {
    const checkoutSpy = () => of(checkoutResponseDto());
    setup(() => of([]), checkoutSpy);

    let error: string | null = null;
    facade.error$.subscribe((value) => (error = value));

    facade.checkout('WELCOME2026');

    expect(error).toContain('vacío');
  });

  it('checkout() exitoso publica el desglose, vacía el carrito y limpia la simulación', () => {
    setup(
      () => of([productDto({ id: 1, stock: 10 })]),
      () => of(checkoutResponseDto({ discountCapApplied: true, effectiveDiscountPercentage: 0.35 }))
    );

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });

    const capture: { result: DiscountBreakdownView | null; sim: DiscountBreakdownView | null } = {
      result: null,
      sim: null,
    };
    facade.checkoutResult$.subscribe((value) => (capture.result = value));
    facade.simulation$.subscribe((value) => (capture.sim = value));

    facade.checkout(null);

    expect(capture.result?.discountCapApplied).toBe(true);
    expect(capture.sim).toBeNull();
    expect(facade['cartState'].getSnapshot()).toEqual([]);
  });

  it('checkout() con error del backend publica el mensaje de ApiError', () => {
    setup(
      () => of([productDto({ id: 1 })]),
      () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { timestamp: 'now', status: 409, error: 'Conflict', message: 'Stock insuficiente' },
            })
        )
    );

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });

    let error: string | null = null;
    facade.error$.subscribe((value) => (error = value));

    facade.checkout(null);

    expect(error).toBe('Stock insuficiente');
  });

  // ---- Drawer del carrito ----

  it('toggleCart()/openCart()/closeCart() actualizan cartOpen$', () => {
    setup(() => of([]), () => of(checkoutResponseDto()));

    let open: boolean | undefined;
    facade.cartOpen$.subscribe((value) => (open = value));

    expect(open).toBe(false);
    facade.openCart();
    expect(open).toBe(true);
    facade.closeCart();
    expect(open).toBe(false);
    facade.toggleCart();
    expect(open).toBe(true);
  });

  // ---- Navegación catálogo <-> checkout ----

  it('goToCheckout() con el carrito vacío marca error y no cambia de vista', () => {
    setup(() => of([]), () => of(checkoutResponseDto()));

    let view: string | undefined;
    facade.view$.subscribe((value) => (view = value));
    let error: string | null = null;
    facade.error$.subscribe((value) => (error = value));

    facade.goToCheckout();

    expect(view).toBe('catalog');
    expect(error).toContain('vacío');
  });

  it('goToCheckout() con productos cierra el drawer, cambia a checkout y dispara simulate()', () => {
    const simulateSpy = vi.fn(() => of(checkoutResponseDto({ categoryDiscountAmount: 15 })));
    setup(() => of([productDto({ id: 1 })]), () => of(checkoutResponseDto()), simulateSpy);

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });

    let view: string | undefined;
    facade.view$.subscribe((value) => (view = value));
    let open: boolean | undefined;
    facade.cartOpen$.subscribe((value) => (open = value));
    facade.openCart();

    const capture: { sim: DiscountBreakdownView | null } = { sim: null };
    facade.simulation$.subscribe((value) => (capture.sim = value));

    facade.goToCheckout();

    expect(view).toBe('checkout');
    expect(open).toBe(false);
    expect(simulateSpy).toHaveBeenCalled();
    expect(capture.sim?.categoryDiscountAmount).toBe(15);
  });

  it('backToCatalog() vuelve a catálogo y limpia simulación y resultado confirmado', () => {
    setup(
      () => of([productDto({ id: 1 })]),
      () => of(checkoutResponseDto()),
      () => of(checkoutResponseDto({ categoryDiscountAmount: 15 }))
    );

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });
    facade.goToCheckout();

    let view: string | undefined;
    facade.view$.subscribe((value) => (view = value));
    const capture: { sim: DiscountBreakdownView | null } = { sim: null };
    facade.simulation$.subscribe((value) => (capture.sim = value));

    facade.backToCatalog();

    expect(view).toBe('catalog');
    expect(capture.sim).toBeNull();
  });

  // ---- validateCoupon() ----

  it('validateCoupon() traduce la respuesta del backend a la vista de UI', () => {
    setup(() => of([]), () => of(checkoutResponseDto()), undefined, () => of(couponDto({ discountPercentage: 0.15 })));

    let result: unknown;
    facade.validateCoupon('WELCOME2026').subscribe((value) => (result = value));

    expect(result).toEqual({ code: 'WELCOME2026', valid: true, discountPercentage: 15 });
  });

  it('validateCoupon() no rompe el stream si la API falla: resuelve a inválido', () => {
    setup(() => of([]), () => of(checkoutResponseDto()), undefined, () =>
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    let result: unknown;
    facade.validateCoupon('X').subscribe((value) => (result = value));

    expect(result).toEqual({ code: 'X', valid: false, discountPercentage: null, checkFailed: true });
  });

  // ---- simulate() ----

  it('simulate() con el carrito vacío publica null sin llamar a la API', () => {
    const simulateSpy = vi.fn(() => of(checkoutResponseDto()));
    setup(() => of([]), () => of(checkoutResponseDto()), simulateSpy);

    const capture: { sim: DiscountBreakdownView | null } = { sim: null };
    facade.simulation$.subscribe((value) => (capture.sim = value));

    facade.simulate(null);

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(capture.sim).toBeNull();
  });

  it('simulate() con productos publica el desglose traducido', () => {
    setup(
      () => of([productDto({ id: 1 })]),
      () => of(checkoutResponseDto()),
      () => of(checkoutResponseDto({ couponDiscountAmount: 22.5, effectiveDiscountPercentage: 0.15 }))
    );

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });

    const capture: { sim: DiscountBreakdownView | null } = { sim: null };
    facade.simulation$.subscribe((value) => (capture.sim = value));

    facade.simulate('WELCOME2026');

    expect(capture.sim?.couponDiscountAmount).toBe(22.5);
    expect(capture.sim?.effectiveDiscountPercentage).toBe(15);
  });
});

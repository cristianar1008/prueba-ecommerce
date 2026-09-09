import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopFacadeService } from './shop-facade.service';
import { ProductApiService } from './product-api.service';
import { CheckoutApiService } from './checkout-api.service';
import { ProductResponseDto } from '../models/api/product-response.dto';
import { CheckoutResponseDto } from '../models/api/checkout.dto';
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

describe('ShopFacadeService', () => {
  let facade: ShopFacadeService;

  function setup(getAllImpl: () => any, checkoutImpl: () => any) {
    const productApi = { getAll: getAllImpl };
    const checkoutApi = { checkout: checkoutImpl };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProductApiService, useValue: productApi },
        { provide: CheckoutApiService, useValue: checkoutApi },
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

  it('checkout() exitoso publica el desglose y vacía el carrito', () => {
    setup(
      () => of([productDto({ id: 1, stock: 10 })]),
      () => of(checkoutResponseDto({ discountCapApplied: true, effectiveDiscountPercentage: 0.35 }))
    );

    facade.loadProducts();
    facade.addToCart({ id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' });

    const capture: { result: DiscountBreakdownView | null } = { result: null };
    facade.checkoutResult$.subscribe((value) => {
      capture.result = value;
    });

    facade.checkout(null);

    expect(capture.result?.discountCapApplied).toBe(true);
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
});

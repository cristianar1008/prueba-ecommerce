import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CheckoutApiService } from './checkout-api.service';
import { CheckoutResponseDto } from '../models/api/checkout.dto';

describe('CheckoutApiService', () => {
  let service: CheckoutApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hace POST a /api/checkout con el body exacto y devuelve la respuesta', () => {
    const response: CheckoutResponseDto = {
      orderId: 1,
      subtotalOriginal: 150,
      categoryDiscountAmount: 0,
      volumeDiscountAmount: 0,
      couponDiscountAmount: 0,
      discountCapApplied: false,
      totalDiscountAmount: 0,
      effectiveDiscountPercentage: 0,
      totalToPay: 150,
    };

    let result: CheckoutResponseDto | undefined;
    service.checkout({ items: [{ productId: 1, quantity: 1 }], couponCode: null }).subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/checkout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items: [{ productId: 1, quantity: 1 }], couponCode: null });
    req.flush(response);

    expect(result).toEqual(response);
  });

  it('hace POST a /api/checkout/simulate con el body exacto y devuelve la respuesta', () => {
    const response: CheckoutResponseDto = {
      orderId: null,
      subtotalOriginal: 150,
      categoryDiscountAmount: 15,
      volumeDiscountAmount: 0,
      couponDiscountAmount: 0,
      discountCapApplied: false,
      totalDiscountAmount: 15,
      effectiveDiscountPercentage: 0.1,
      totalToPay: 135,
    };

    let result: CheckoutResponseDto | undefined;
    service
      .simulate({ items: [{ productId: 1, quantity: 1 }], couponCode: null })
      .subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/checkout/simulate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items: [{ productId: 1, quantity: 1 }], couponCode: null });
    req.flush(response);

    expect(result).toEqual(response);
  });
});

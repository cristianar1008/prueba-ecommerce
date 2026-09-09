import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CouponApiService } from './coupon-api.service';
import { CouponValidationResponseDto } from '../models/api/coupon-validation.dto';

describe('CouponApiService', () => {
  let service: CouponApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CouponApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hace GET a /api/coupons/{code} y devuelve la respuesta tal cual', () => {
    const response: CouponValidationResponseDto = { code: 'WELCOME2026', valid: true, discountPercentage: 0.15 };

    let result: CouponValidationResponseDto | undefined;
    service.validate('WELCOME2026').subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/coupons/WELCOME2026');
    expect(req.request.method).toBe('GET');
    req.flush(response);

    expect(result).toEqual(response);
  });
});

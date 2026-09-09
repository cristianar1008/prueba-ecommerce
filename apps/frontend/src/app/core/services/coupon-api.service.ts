import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CouponValidationResponseDto } from '../models/api/coupon-validation.dto';

/** HTTP puro. Su único trabajo es hablar con GET /api/coupons/{code}. */
@Injectable({ providedIn: 'root' })
export class CouponApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/coupons';

  validate(code: string): Observable<CouponValidationResponseDto> {
    return this.http.get<CouponValidationResponseDto>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }
}

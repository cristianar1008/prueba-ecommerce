import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckoutRequestDto, CheckoutResponseDto } from '../models/api/checkout.dto';

/** HTTP puro. Su único trabajo es hablar con /api/checkout (real y simulado). */
@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/checkout';

  checkout(request: CheckoutRequestDto): Observable<CheckoutResponseDto> {
    return this.http.post<CheckoutResponseDto>(this.baseUrl, request);
  }

  /**
   * POST /api/checkout/simulate: mismo request/response que checkout(),
   * pero de solo lectura (no descuenta stock ni persiste la orden). Se usa
   * para mostrar el desglose de descuentos ANTES de que el cliente
   * confirme la compra real.
   */
  simulate(request: CheckoutRequestDto): Observable<CheckoutResponseDto> {
    return this.http.post<CheckoutResponseDto>(`${this.baseUrl}/simulate`, request);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductResponseDto } from '../models/api/product-response.dto';

/**
 * HTTP puro. No mapea, no guarda estado, no sabe qué es un carrito.
 * Su único trabajo es hablar con GET /api/products.
 */
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  getAll(): Observable<ProductResponseDto[]> {
    return this.http.get<ProductResponseDto[]>(this.baseUrl);
  }
}

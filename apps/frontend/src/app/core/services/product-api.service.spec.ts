import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductApiService } from './product-api.service';
import { ProductResponseDto } from '../models/api/product-response.dto';

describe('ProductApiService', () => {
  let service: ProductApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hace GET a /api/products y devuelve el array tal cual', () => {
    const dtos: ProductResponseDto[] = [
      { id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: null },
    ];

    let result: ProductResponseDto[] | undefined;
    service.getAll().subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('GET');
    req.flush(dtos);

    expect(result).toEqual(dtos);
  });
});

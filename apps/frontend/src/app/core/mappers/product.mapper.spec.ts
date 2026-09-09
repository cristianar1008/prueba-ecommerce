import { toProduct } from './product.mapper';
import { ProductResponseDto } from '../models/api/product-response.dto';

function dto(overrides: Partial<ProductResponseDto> = {}): ProductResponseDto {
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

describe('product.mapper', () => {
  it('mapea todos los campos tal cual cuando imageUrl viene presente', () => {
    const result = toProduct(dto());
    expect(result).toEqual({
      id: 1,
      name: 'Laptop X1',
      unitPrice: 150,
      stock: 10,
      categoryName: 'Tecnologia',
      imageUrl: 'https://example.com/laptop.png',
    });
  });

  it('usa una imagen de respaldo cuando imageUrl viene null', () => {
    const result = toProduct(dto({ imageUrl: null }));
    expect(result.imageUrl).toContain('placehold.co');
  });
});

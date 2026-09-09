import { ProductResponseDto } from '../models/api/product-response.dto';
import { Product } from '../models/product.model';

const FALLBACK_IMAGE = 'https://placehold.co/400x300/94a3b8/ffffff?text=Sin+imagen';

/** Traduce el DTO crudo del backend al modelo que consume la UI. */
export function toProduct(dto: ProductResponseDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    unitPrice: dto.unitPrice,
    stock: dto.stock,
    categoryName: dto.categoryName,
    imageUrl: dto.imageUrl ?? FALLBACK_IMAGE,
  };
}

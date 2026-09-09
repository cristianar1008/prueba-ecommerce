/**
 * Modelo de dominio del frontend: lo que los componentes consumen.
 * Lo produce ProductMapper a partir de ProductResponseDto (la forma cruda
 * que manda el backend) — los componentes nunca ven el DTO directamente.
 */
export interface Product {
  id: number;
  name: string;
  unitPrice: number;
  stock: number;
  categoryName: string;
  imageUrl: string;
}

/** Una línea del carrito: un producto + la cantidad elegida. */
export interface CartLine {
  product: Product;
  quantity: number;
}

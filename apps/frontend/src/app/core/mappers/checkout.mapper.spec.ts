import { toCheckoutRequestDto, toDiscountBreakdownView } from './checkout.mapper';
import { CartLine, Product } from '../models/product.model';
import { CheckoutResponseDto } from '../models/api/checkout.dto';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Laptop X1',
    unitPrice: 150,
    stock: 10,
    categoryName: 'Tecnologia',
    imageUrl: 'x',
    ...overrides,
  };
}

describe('toCheckoutRequestDto', () => {
  it('mapea las líneas del carrito a items {productId, quantity}', () => {
    const lines: CartLine[] = [
      { product: product({ id: 1 }), quantity: 2 },
      { product: product({ id: 2 }), quantity: 1 },
    ];

    const request = toCheckoutRequestDto(lines, 'WELCOME2026');

    expect(request.items).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ]);
    expect(request.couponCode).toBe('WELCOME2026');
  });

  it('normaliza un cupón en blanco a null', () => {
    const request = toCheckoutRequestDto([], '   ');
    expect(request.couponCode).toBeNull();
  });

  it('deja couponCode en null cuando no se pasa código', () => {
    const request = toCheckoutRequestDto([], null);
    expect(request.couponCode).toBeNull();
  });
});

describe('toDiscountBreakdownView', () => {
  it('escala effectiveDiscountPercentage de fracción (0-1) a porcentaje (0-100)', () => {
    const dto: CheckoutResponseDto = {
      orderId: 1,
      subtotalOriginal: 200,
      categoryDiscountAmount: 20,
      volumeDiscountAmount: 9,
      couponDiscountAmount: 25.65,
      discountCapApplied: false,
      totalDiscountAmount: 54.65,
      effectiveDiscountPercentage: 0.2733,
      totalToPay: 145.35,
    };

    const view = toDiscountBreakdownView(dto);

    expect(view.effectiveDiscountPercentage).toBeCloseTo(27.33, 2);
    expect(view.discountCapApplied).toBe(false);
    expect(view.totalToPay).toBe(145.35);
  });

  it('propaga discountCapApplied en true cuando el backend truncó al 35%', () => {
    const dto: CheckoutResponseDto = {
      orderId: 2,
      subtotalOriginal: 200,
      categoryDiscountAmount: 50,
      volumeDiscountAmount: 20,
      couponDiscountAmount: 10,
      discountCapApplied: true,
      totalDiscountAmount: 70,
      effectiveDiscountPercentage: 0.35,
      totalToPay: 130,
    };

    const view = toDiscountBreakdownView(dto);

    expect(view.discountCapApplied).toBe(true);
    expect(view.effectiveDiscountPercentage).toBeCloseTo(35, 2);
  });
});

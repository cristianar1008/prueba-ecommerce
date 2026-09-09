import { CartLine } from '../models/product.model';
import { CheckoutRequestDto, CheckoutResponseDto } from '../models/api/checkout.dto';
import { DiscountBreakdownView } from '../models/discount-breakdown.model';

/** Traduce el carrito (modelo de UI) a la forma exacta que espera POST /api/checkout. */
export function toCheckoutRequestDto(lines: CartLine[], couponCode: string | null): CheckoutRequestDto {
  return {
    items: lines.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
    })),
    couponCode: couponCode && couponCode.trim().length > 0 ? couponCode.trim() : null,
  };
}

/**
 * Traduce la respuesta cruda del backend a la vista que pinta el desglose
 * (HU2) y dispara la alerta del 35% (HU4). El porcentaje llega del backend
 * como fracción (0.2733) y aquí se escala a 0-100 para mostrarlo.
 */
export function toDiscountBreakdownView(dto: CheckoutResponseDto): DiscountBreakdownView {
  return {
    categoryDiscountAmount: dto.categoryDiscountAmount,
    volumeDiscountAmount: dto.volumeDiscountAmount,
    couponDiscountAmount: dto.couponDiscountAmount,
    discountCapApplied: dto.discountCapApplied,
    totalDiscountAmount: dto.totalDiscountAmount,
    effectiveDiscountPercentage: dto.effectiveDiscountPercentage * 100,
    subtotalOriginal: dto.subtotalOriginal,
    totalToPay: dto.totalToPay,
  };
}

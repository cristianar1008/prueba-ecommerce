/**
 * Vista de UI del resultado de un checkout, ya traducida desde
 * CheckoutResponseDto por CheckoutMapper. Trae los porcentajes ya
 * escalados a 0-100 para no repetir esa conversión en cada componente.
 */
export interface DiscountBreakdownView {
  categoryDiscountAmount: number;
  volumeDiscountAmount: number;
  couponDiscountAmount: number;
  discountCapApplied: boolean;
  totalDiscountAmount: number;
  effectiveDiscountPercentage: number; // 0-100, ya escalado para mostrar
  subtotalOriginal: number;
  totalToPay: number;
}

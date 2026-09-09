/** Forma exacta de CheckoutItemRequest / CheckoutRequest (web/dto en el backend). */
export interface CheckoutItemRequestDto {
  productId: number;
  quantity: number;
}

export interface CheckoutRequestDto {
  items: CheckoutItemRequestDto[];
  couponCode: string | null;
}

/** Forma exacta de CheckoutResponse (web/dto en el backend). */
export interface CheckoutResponseDto {
  orderId: number;
  subtotalOriginal: number;
  categoryDiscountAmount: number;
  volumeDiscountAmount: number;
  couponDiscountAmount: number;
  discountCapApplied: boolean;
  totalDiscountAmount: number;
  effectiveDiscountPercentage: number; // 0-1, tal como lo manda Java (BigDecimal)
  totalToPay: number;
}

/** Forma exacta de ApiError (web/dto en el backend), la que manda GlobalExceptionHandler. */
export interface ApiErrorDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

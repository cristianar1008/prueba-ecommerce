/** Forma exacta de CouponValidationResponse (web/dto en el backend). */
export interface CouponValidationResponseDto {
  code: string;
  valid: boolean;
  discountPercentage: number | null; // 0-1 (BigDecimal de Java), o null si no es valido
}

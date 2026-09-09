/**
 * Vista de UI del resultado de GET /api/coupons/{code}, ya traducida por
 * CouponMapper. El porcentaje llega escalado a 0-100 (igual criterio que
 * DiscountBreakdownView) para no repetir esa conversión en el componente.
 *
 * checkFailed distingue "el backend contestó y el cupón no es válido"
 * (valid: false, checkFailed: undefined) de "no pudimos ni preguntarle al
 * backend" (valid: false, checkFailed: true) -- son errores muy distintos
 * y mostrarlos igual en la UI ("cupón inválido") confunde al usuario y
 * esconde bugs reales del lado del backend.
 */
export interface CouponValidationView {
  code: string;
  valid: boolean;
  discountPercentage: number | null; // 0-100, ya escalado para mostrar
  checkFailed?: boolean;
}

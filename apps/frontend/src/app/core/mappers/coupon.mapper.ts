import { CouponValidationResponseDto } from '../models/api/coupon-validation.dto';
import { CouponValidationView } from '../models/coupon-validation.model';

/** Traduce la respuesta cruda de GET /api/coupons/{code} a la vista que pinta el campo de cupón. */
export function toCouponValidationView(dto: CouponValidationResponseDto): CouponValidationView {
  return {
    code: dto.code,
    valid: dto.valid,
    discountPercentage: dto.discountPercentage !== null ? dto.discountPercentage * 100 : null,
  };
}

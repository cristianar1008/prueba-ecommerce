import { toCouponValidationView } from './coupon.mapper';

describe('toCouponValidationView', () => {
  it('escala el porcentaje de 0-1 a 0-100 cuando el cupón es válido', () => {
    const view = toCouponValidationView({ code: 'WELCOME2026', valid: true, discountPercentage: 0.15 });
    expect(view).toEqual({ code: 'WELCOME2026', valid: true, discountPercentage: 15 });
  });

  it('deja discountPercentage en null cuando el cupón no es válido', () => {
    const view = toCouponValidationView({ code: 'FAKE2020', valid: false, discountPercentage: null });
    expect(view).toEqual({ code: 'FAKE2020', valid: false, discountPercentage: null });
  });
});

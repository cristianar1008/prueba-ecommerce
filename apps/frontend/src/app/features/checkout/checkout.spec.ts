import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Checkout } from './checkout';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { CouponValidationView } from '../../core/models/coupon-validation.model';

function createFixture() {
  const cartLines$ = new BehaviorSubject<any[]>([]);
  const simulation$ = new BehaviorSubject<any>(null);
  const simulationLoading$ = new BehaviorSubject<boolean>(false);
  const loading$ = new BehaviorSubject<boolean>(false);
  const error$ = new BehaviorSubject<string | null>(null);
  const checkoutResult$ = new BehaviorSubject<any>(null);
  const checkout = vi.fn();
  const backToCatalog = vi.fn();
  const simulate = vi.fn();
  const validateCoupon = vi.fn((code: string) =>
    of<CouponValidationView>({ code, valid: true, discountPercentage: 15 })
  );

  TestBed.configureTestingModule({
    imports: [Checkout],
    providers: [
      {
        provide: ShopFacadeService,
        useValue: {
          cartLines$,
          simulation$,
          simulationLoading$,
          loading$,
          error$,
          checkoutResult$,
          checkout,
          backToCatalog,
          simulate,
          validateCoupon,
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(Checkout);
  fixture.detectChanges();
  return { fixture, checkout, backToCatalog, simulate, validateCoupon };
}

describe('Checkout', () => {
  it('escribir en el campo de cupón NO dispara la validación automáticamente', () => {
    const { fixture, validateCoupon } = createFixture();
    fixture.componentInstance.onCouponInput('WELCOME2026');
    expect(validateCoupon).not.toHaveBeenCalled();
  });

  it('validateCoupon() solo se llama al hacer click en "Validar"', () => {
    const { fixture, validateCoupon, simulate } = createFixture();
    const component = fixture.componentInstance;

    component.onCouponInput('WELCOME2026');
    component.validateCoupon();

    expect(validateCoupon).toHaveBeenCalledWith('WELCOME2026');
    expect(simulate).toHaveBeenCalledWith('WELCOME2026');
    expect(component.couponStatus()?.valid).toBe(true);
  });

  it('pay() usa el cupón ya validado', () => {
    const { fixture, checkout } = createFixture();
    const component = fixture.componentInstance;

    component.onCouponInput('WELCOME2026');
    component.validateCoupon();
    component.pay();

    expect(checkout).toHaveBeenCalledWith('WELCOME2026');
  });

  it('pay() usa null si nunca se validó ningún cupón', () => {
    const { fixture, checkout } = createFixture();
    fixture.componentInstance.pay();
    expect(checkout).toHaveBeenCalledWith(null);
  });

  it('volver a escribir después de validar invalida el cupón anterior', () => {
    const { fixture, checkout } = createFixture();
    const component = fixture.componentInstance;

    component.onCouponInput('WELCOME2026');
    component.validateCoupon();
    expect(component.couponStatus()?.valid).toBe(true);

    component.onCouponInput('WELCOME2026X');
    expect(component.couponStatus()).toBeNull();

    component.pay();
    expect(checkout).toHaveBeenCalledWith(null);
  });

  it('back() llama a shop.backToCatalog()', () => {
    const { fixture, backToCatalog } = createFixture();
    fixture.componentInstance.back();
    expect(backToCatalog).toHaveBeenCalled();
  });
});

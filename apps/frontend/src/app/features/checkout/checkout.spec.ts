import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Checkout } from './checkout';
import { ShopFacadeService } from '../../core/services/shop-facade.service';

function createFixture() {
  const loading$ = new BehaviorSubject<boolean>(false);
  const error$ = new BehaviorSubject<string | null>(null);
  const checkoutResult$ = new BehaviorSubject<null>(null);
  const checkout = vi.fn();

  TestBed.configureTestingModule({
    imports: [Checkout],
    providers: [{ provide: ShopFacadeService, useValue: { loading$, error$, checkoutResult$, checkout } }],
  });

  const fixture = TestBed.createComponent(Checkout);
  fixture.detectChanges();
  return { fixture, checkout };
}

describe('Checkout', () => {
  it('confirm() llama a shop.checkout() con el código de cupón ingresado', () => {
    const { fixture, checkout } = createFixture();
    const component = fixture.componentInstance;

    component.couponCode.set('WELCOME2026');
    component.confirm();

    expect(checkout).toHaveBeenCalledWith('WELCOME2026');
  });

  it('confirm() pasa null cuando no hay cupón', () => {
    const { fixture, checkout } = createFixture();
    fixture.componentInstance.confirm();
    expect(checkout).toHaveBeenCalledWith(null);
  });
});

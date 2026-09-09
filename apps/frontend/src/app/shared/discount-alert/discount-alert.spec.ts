import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { DiscountAlert } from './discount-alert';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { DiscountBreakdownView } from '../../core/models/discount-breakdown.model';

function breakdown(overrides: Partial<DiscountBreakdownView> = {}): DiscountBreakdownView {
  return {
    categoryDiscountAmount: 0,
    volumeDiscountAmount: 0,
    couponDiscountAmount: 0,
    discountCapApplied: false,
    totalDiscountAmount: 0,
    effectiveDiscountPercentage: 0,
    subtotalOriginal: 0,
    totalToPay: 0,
    ...overrides,
  };
}

describe('DiscountAlert', () => {
  let checkoutResult$: BehaviorSubject<DiscountBreakdownView | null>;

  function createFixture() {
    checkoutResult$ = new BehaviorSubject<DiscountBreakdownView | null>(null);

    TestBed.configureTestingModule({
      imports: [DiscountAlert],
      providers: [{ provide: ShopFacadeService, useValue: { checkoutResult$ } }],
    });

    const fixture = TestBed.createComponent(DiscountAlert);
    fixture.detectChanges();
    return fixture;
  }

  it('no muestra nada mientras no haya un resultado de checkout', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.discount-alert')).toBeNull();
  });

  it('no muestra la alerta si el checkout no llegó al tope del 35%', () => {
    const fixture = createFixture();
    checkoutResult$.next(breakdown({ discountCapApplied: false }));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.discount-alert')).toBeNull();
  });

  it('muestra el texto exacto exigido cuando discountCapApplied es true', () => {
    const fixture = createFixture();
    checkoutResult$.next(breakdown({ discountCapApplied: true }));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.discount-alert')?.textContent).toContain(
      '¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)'
    );
  });

  it('el botón de cerrar oculta la alerta', () => {
    const fixture = createFixture();
    checkoutResult$.next(breakdown({ discountCapApplied: true }));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.discount-alert')).toBeNull();
  });

  it('un nuevo checkout sin tope vuelve a ocultar la alerta', () => {
    const fixture = createFixture();
    checkoutResult$.next(breakdown({ discountCapApplied: true }));
    fixture.detectChanges();

    checkoutResult$.next(breakdown({ discountCapApplied: false }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.discount-alert')).toBeNull();
  });
});

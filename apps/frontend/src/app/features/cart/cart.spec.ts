import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Cart } from './cart';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { CartLine } from '../../core/models/product.model';

function createFixture(lines: CartLine[] = [], open = true) {
  const cartOpen$ = new BehaviorSubject<boolean>(open);
  const cartLines$ = new BehaviorSubject<CartLine[]>(lines);
  const subtotal$ = new BehaviorSubject<number>(0);

  TestBed.configureTestingModule({
    imports: [Cart],
    providers: [
      {
        provide: ShopFacadeService,
        useValue: {
          cartOpen$,
          cartLines$,
          subtotal$,
          incrementFromCart: vi.fn(),
          decrementFromCart: vi.fn(),
          removeFromCart: vi.fn(),
          closeCart: vi.fn(),
          goToCheckout: vi.fn(),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(Cart);
  fixture.detectChanges();
  return fixture;
}

describe('Cart', () => {
  it('no renderiza nada cuando el drawer está cerrado', () => {
    const fixture = createFixture([], false);
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('muestra el mensaje de carrito vacío cuando no hay líneas', () => {
    const fixture = createFixture([], true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('vacío');
  });

  it('renderiza una línea por producto y el botón de ir a pagar', () => {
    const line: CartLine = {
      product: { id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' },
      quantity: 2,
    };
    const fixture = createFixture([line], true);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Laptop X1');
    expect(text).toContain('Ir a pagar');
  });
});

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Cart } from './cart';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { CartLine } from '../../core/models/product.model';

function createFixture(lines: CartLine[] = []) {
  const cartLines$ = new BehaviorSubject<CartLine[]>(lines);
  const subtotal$ = new BehaviorSubject<number>(0);

  TestBed.configureTestingModule({
    imports: [Cart],
    providers: [
      {
        provide: ShopFacadeService,
        useValue: { cartLines$, subtotal$, incrementFromCart: vi.fn(), decrementFromCart: vi.fn(), removeFromCart: vi.fn() },
      },
    ],
  });

  const fixture = TestBed.createComponent(Cart);
  fixture.detectChanges();
  return fixture;
}

describe('Cart', () => {
  it('muestra el mensaje de carrito vacío cuando no hay líneas', () => {
    const fixture = createFixture([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('vacío');
  });

  it('renderiza una línea por producto en el carrito', () => {
    const line: CartLine = {
      product: { id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' },
      quantity: 2,
    };
    const fixture = createFixture([line]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Laptop X1');
  });
});

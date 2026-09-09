import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Catalog } from './catalog';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { Product, CartLine } from '../../core/models/product.model';

function createFixture(products: Product[] = [], cartLines: CartLine[] = []) {
  const products$ = new BehaviorSubject<Product[]>(products);
  const cartLines$ = new BehaviorSubject<CartLine[]>(cartLines);
  const addToCart = vi.fn();

  TestBed.configureTestingModule({
    imports: [Catalog],
    providers: [{ provide: ShopFacadeService, useValue: { products$, cartLines$, loadProducts: vi.fn(), addToCart } }],
  });

  const fixture = TestBed.createComponent(Catalog);
  fixture.detectChanges();
  return { fixture, addToCart };
}

describe('Catalog', () => {
  it('muestra un mensaje mientras no hay productos', () => {
    const { fixture } = createFixture([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando');
  });

  it('renderiza una tarjeta por producto y permite agregar al carrito', () => {
    const product: Product = { id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' };
    const { fixture, addToCart } = createFixture([product]);

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    button.click();

    expect(addToCart).toHaveBeenCalledWith(product);
  });
});

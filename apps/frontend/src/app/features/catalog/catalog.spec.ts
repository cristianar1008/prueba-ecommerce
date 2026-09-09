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

const laptop: Product = { id: 1, name: 'Laptop X1', unitPrice: 150, stock: 10, categoryName: 'Tecnologia', imageUrl: 'x' };
const mouse: Product = { id: 2, name: 'Mouse Inalambrico', unitPrice: 50, stock: 20, categoryName: 'Tecnologia', imageUrl: 'x' };
const silla: Product = { id: 3, name: 'Silla de Oficina', unitPrice: 90, stock: 5, categoryName: 'Hogar', imageUrl: 'x' };

describe('Catalog', () => {
  it('muestra un mensaje mientras no hay productos', () => {
    const { fixture } = createFixture([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando');
  });

  it('renderiza una tarjeta por producto y permite agregar al carrito', () => {
    const { fixture, addToCart } = createFixture([laptop]);

    const button = (fixture.nativeElement as HTMLElement).querySelector('.card button') as HTMLButtonElement;
    button.click();

    expect(addToCart).toHaveBeenCalledWith(laptop);
  });

  it('deriva la lista de categorias disponibles a partir de los productos cargados', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    expect(fixture.componentInstance.categories()).toEqual(['Hogar', 'Tecnologia']);
  });

  it('el buscador filtra por nombre', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    const component = fixture.componentInstance;

    const searchBox = (fixture.nativeElement as HTMLElement).querySelector('.search-box') as HTMLInputElement;
    searchBox.value = 'mouse';
    searchBox.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredRows().map((row) => row.product.id)).toEqual([2]);
  });

  it('el buscador tambien filtra por categoria', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    const component = fixture.componentInstance;

    const searchBox = (fixture.nativeElement as HTMLElement).querySelector('.search-box') as HTMLInputElement;
    searchBox.value = 'hogar';
    searchBox.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredRows().map((row) => row.product.id)).toEqual([3]);
  });

  it('marcar una categoria en el checklist filtra la grilla', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    const component = fixture.componentInstance;

    const checkbox = (fixture.nativeElement as HTMLElement).querySelector(
      '.checkbox-row input[type="checkbox"]'
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // "Hogar" es la primera categoria alfabeticamente -> solo la silla
    expect(component.filteredRows().map((row) => row.product.id)).toEqual([3]);
  });

  it('el rango de precio filtra por minimo y maximo', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    const component = fixture.componentInstance;

    component.onMinPriceInput({ target: { value: '80' } } as unknown as Event);
    component.onMaxPriceInput({ target: { value: '100' } } as unknown as Event);

    expect(component.filteredRows().map((row) => row.product.id)).toEqual([3]);
  });

  it('clearFilters() resetea busqueda, categorias y precios', () => {
    const { fixture } = createFixture([laptop, mouse, silla]);
    const component = fixture.componentInstance;

    component.onSearchInput({ target: { value: 'mouse' } } as unknown as Event);
    component.onCategoryToggle('Hogar', { target: { checked: true } } as unknown as Event);
    component.onMinPriceInput({ target: { value: '10' } } as unknown as Event);
    component.onMaxPriceInput({ target: { value: '200' } } as unknown as Event);
    expect(component.activeFilterCount()).toBe(4);

    component.clearFilters();

    expect(component.activeFilterCount()).toBe(0);
    expect(component.filteredRows().length).toBe(3);
  });

  it('descuenta la cantidad ya agregada al carrito del stock disponible', () => {
    const { fixture } = createFixture([laptop], [{ product: laptop, quantity: 3 }]);
    const component = fixture.componentInstance;

    expect(component.rows()[0].quantityInCart).toBe(3);
  });
});

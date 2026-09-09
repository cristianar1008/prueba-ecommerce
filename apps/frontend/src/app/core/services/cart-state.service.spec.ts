import { CartStateService } from './cart-state.service';
import { Product } from '../models/product.model';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Laptop X1',
    unitPrice: 150,
    stock: 10,
    categoryName: 'Tecnologia',
    imageUrl: 'https://example.com/laptop.png',
    ...overrides,
  };
}

describe('CartStateService', () => {
  let service: CartStateService;

  beforeEach(() => {
    service = new CartStateService();
  });

  it('empieza vacío', () => {
    expect(service.getSnapshot()).toEqual([]);
  });

  it('agrega un producto nuevo con cantidad 1', () => {
    service.add(product());
    expect(service.getSnapshot()).toEqual([{ product: product(), quantity: 1 }]);
  });

  it('incrementa la cantidad si el producto ya está en el carrito', () => {
    service.add(product());
    service.add(product());
    expect(service.getSnapshot()[0].quantity).toBe(2);
  });

  it('no deja agregar más unidades que el stock disponible', () => {
    service.add(product({ stock: 1 }));
    service.add(product({ stock: 1 }));
    expect(service.getSnapshot()[0].quantity).toBe(1);
  });

  it('no agrega un producto sin stock', () => {
    service.add(product({ stock: 0 }));
    expect(service.getSnapshot()).toEqual([]);
  });

  it('decrementa la cantidad de una línea existente', () => {
    service.add(product());
    service.add(product());
    service.decrement(1);
    expect(service.getSnapshot()[0].quantity).toBe(1);
  });

  it('elimina la línea cuando decrementa desde cantidad 1', () => {
    service.add(product());
    service.decrement(1);
    expect(service.getSnapshot()).toEqual([]);
  });

  it('decrementar un producto que no está en el carrito no hace nada', () => {
    service.decrement(999);
    expect(service.getSnapshot()).toEqual([]);
  });

  it('remove() quita la línea sin importar la cantidad', () => {
    service.add(product());
    service.add(product());
    service.remove(1);
    expect(service.getSnapshot()).toEqual([]);
  });

  it('clear() vacía todo el carrito', () => {
    service.add(product({ id: 1 }));
    service.add(product({ id: 2 }));
    service.clear();
    expect(service.getSnapshot()).toEqual([]);
  });

  it('subtotal$ calcula precio x cantidad sumado entre líneas', () => {
    let subtotal = 0;
    service.subtotal$.subscribe((value) => (subtotal = value));

    service.add(product({ id: 1, unitPrice: 150 }));
    service.add(product({ id: 2, unitPrice: 50, stock: 5 }));

    expect(subtotal).toBe(200);
  });

  it('itemCount$ cuenta unidades, no líneas', () => {
    let count = 0;
    service.itemCount$.subscribe((value) => (count = value));

    service.add(product({ id: 1, stock: 5 }));
    service.add(product({ id: 1, stock: 5 })); // misma línea, cantidad 2
    service.add(product({ id: 2, stock: 5 })); // línea nueva

    expect(count).toBe(3);
  });
});

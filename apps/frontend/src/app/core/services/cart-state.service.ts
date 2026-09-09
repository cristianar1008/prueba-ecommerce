import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartLine, Product } from '../models/product.model';

/**
 * Observer: el carrito es un BehaviorSubject (el "sujeto") y cualquier
 * componente que se suscriba a lines$/subtotal$/itemCount$ (los
 * "observadores") se entera y se re-renderiza solo cuando el carrito
 * cambia — sin que este servicio sepa quién lo está escuchando.
 *
 * Regla de negocio local: nunca se deja agregar más unidades de un
 * producto que las que su stock permite (HU1 exige que el subtotal
 * se actualice en tiempo real con datos consistentes).
 */
@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly linesSubject = new BehaviorSubject<CartLine[]>([]);

  readonly lines$: Observable<CartLine[]> = this.linesSubject.asObservable();

  readonly subtotal$: Observable<number> = this.lines$.pipe(
    map((lines) => lines.reduce((sum, line) => sum + line.product.unitPrice * line.quantity, 0))
  );

  readonly itemCount$: Observable<number> = this.lines$.pipe(
    map((lines) => lines.reduce((sum, line) => sum + line.quantity, 0))
  );

  /** Snapshot síncrono — lo usa la fachada para armar el CheckoutRequest. */
  getSnapshot(): CartLine[] {
    return this.linesSubject.value;
  }

  add(product: Product): void {
    const lines = this.linesSubject.value;
    const existing = lines.find((line) => line.product.id === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        return; // no exceder el stock visible del catálogo
      }
      this.linesSubject.next(
        lines.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        )
      );
      return;
    }

    if (product.stock <= 0) {
      return;
    }
    this.linesSubject.next([...lines, { product, quantity: 1 }]);
  }

  decrement(productId: number): void {
    const lines = this.linesSubject.value;
    const existing = lines.find((line) => line.product.id === productId);
    if (!existing) {
      return;
    }
    if (existing.quantity <= 1) {
      this.remove(productId);
      return;
    }
    this.linesSubject.next(
      lines.map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line))
    );
  }

  remove(productId: number): void {
    this.linesSubject.next(this.linesSubject.value.filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.linesSubject.next([]);
  }
}

import { Component } from '@angular/core';
import { Catalog } from './features/catalog/catalog';
import { Cart } from './features/cart/cart';

@Component({
  selector: 'app-root',
  imports: [Catalog, Cart],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'Core E-Commerce · Descuentos Acumulativos';
}

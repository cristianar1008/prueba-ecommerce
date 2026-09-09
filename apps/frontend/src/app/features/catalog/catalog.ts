import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { Product } from '../../core/models/product.model';

interface CatalogRow {
  product: Product;
  quantityInCart: number;
}

@Component({
  selector: 'app-catalog',
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  private readonly shop = inject(ShopFacadeService);

  readonly rows$: Observable<CatalogRow[]> = combineLatest([
    this.shop.products$,
    this.shop.cartLines$,
  ]).pipe(
    map(([products, lines]) =>
      products.map((product) => ({
        product,
        quantityInCart: lines.find((line) => line.product.id === product.id)?.quantity ?? 0,
      }))
    )
  );

  ngOnInit(): void {
    this.shop.loadProducts();
  }

  addToCart(product: Product): void {
    this.shop.addToCart(product);
  }
}

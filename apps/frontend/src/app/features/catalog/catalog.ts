import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';
import { ShopFacadeService } from '../../core/services/shop-facade.service';
import { Product } from '../../core/models/product.model';

interface CatalogRow {
  product: Product;
  quantityInCart: number;
}

/**
 * Catálogo con filtros 100% client-side: los productos ya se traen todos
 * de una vez (GET /api/products, catálogo chico), así que buscar/filtrar
 * no necesita ida y vuelta al backend. `rows` combina productos + líneas
 * del carrito (para el stock disponible); `filteredRows` deriva de ahí
 * aplicando texto de búsqueda, categorías marcadas y rango de precio.
 */
@Component({
  selector: 'app-catalog',
  imports: [CurrencyPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  private readonly shop = inject(ShopFacadeService);

  readonly rows = toSignal(
    combineLatest([this.shop.products$, this.shop.cartLines$]).pipe(
      map(([products, lines]) =>
        products.map(
          (product): CatalogRow => ({
            product,
            quantityInCart: lines.find((line) => line.product.id === product.id)?.quantity ?? 0,
          })
        )
      )
    ),
    { initialValue: [] as CatalogRow[] }
  );

  readonly searchTerm = signal('');
  readonly selectedCategories = signal<ReadonlySet<string>>(new Set<string>());
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);

  readonly categories = computed<string[]>(() => {
    const names = new Set(this.rows().map((row) => row.product.categoryName));
    return [...names].sort((a, b) => a.localeCompare(b));
  });

  readonly filteredRows = computed<CatalogRow[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categories = this.selectedCategories();
    const min = this.minPrice();
    const max = this.maxPrice();

    return this.rows().filter((row) => {
      const product = row.product;

      if (term.length > 0 && !this.matchesSearch(product, term)) {
        return false;
      }
      if (categories.size > 0 && !categories.has(product.categoryName)) {
        return false;
      }
      if (min !== null && product.unitPrice < min) {
        return false;
      }
      if (max !== null && product.unitPrice > max) {
        return false;
      }
      return true;
    });
  });

  readonly minPriceDisplay = computed<string>(() => {
    const value = this.minPrice();
    return value === null ? '' : String(value);
  });

  readonly maxPriceDisplay = computed<string>(() => {
    const value = this.maxPrice();
    return value === null ? '' : String(value);
  });

  readonly activeFilterCount = computed<number>(() => {
    let count = this.selectedCategories().size;
    if (this.searchTerm().trim().length > 0) count += 1;
    if (this.minPrice() !== null) count += 1;
    if (this.maxPrice() !== null) count += 1;
    return count;
  });

  ngOnInit(): void {
    this.shop.loadProducts();
  }

  addToCart(product: Product): void {
    this.shop.addToCart(product);
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onCategoryToggle(category: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedCategories());
    if (checked) {
      next.add(category);
    } else {
      next.delete(category);
    }
    this.selectedCategories.set(next);
  }

  onMinPriceInput(event: Event): void {
    this.minPrice.set(this.parsePrice((event.target as HTMLInputElement).value));
  }

  onMaxPriceInput(event: Event): void {
    this.maxPrice.set(this.parsePrice((event.target as HTMLInputElement).value));
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategories.set(new Set<string>());
    this.minPrice.set(null);
    this.maxPrice.set(null);
  }

  private matchesSearch(product: Product, term: string): boolean {
    return (
      product.name.toLowerCase().includes(term) || product.categoryName.toLowerCase().includes(term)
    );
  }

  private parsePrice(value: string): number | null {
    if (value.trim() === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}

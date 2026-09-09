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

type SortOrder = 'none' | 'asc' | 'desc';

/**
 * Catálogo con filtros 100% client-side: los productos ya se traen todos
 * de una vez (GET /api/products, catálogo chico), así que buscar/filtrar
 * no necesita ida y vuelta al backend. `rows` combina productos + líneas
 * del carrito (para el stock disponible); `filteredRows` deriva de ahí
 * aplicando texto de búsqueda, categorías marcadas y rango de precio.
 *
 * minPriceText/maxPriceText guardan EXACTAMENTE lo que el usuario escribe
 * (texto crudo) y son lo único que el <input> refleja de vuelta -
 * minPrice/maxPrice (numéricos, para filtrar) se derivan de ahí pero
 * nunca se reescriben sobre el campo. Si el <input> reflejara el numero
 * ya parseado (String(Number(texto))) en cada tecla, escribir un punto
 * decimal o un cero a la izquierda se "comeria" el caracter que el
 * usuario acaba de tipear, porque Number("10.") es 10 y String(10) es
 * "10" - el campo saltaria mientras se escribe.
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
  readonly minPriceText = signal('');
  readonly maxPriceText = signal('');
  readonly sortOrder = signal<SortOrder>('none');

  readonly minPrice = computed<number | null>(() => this.parsePrice(this.minPriceText()));
  readonly maxPrice = computed<number | null>(() => this.parsePrice(this.maxPriceText()));

  readonly categories = computed<string[]>(() => {
    const names = new Set(this.rows().map((row) => row.product.categoryName));
    return [...names].sort((a, b) => a.localeCompare(b));
  });

  readonly filteredRows = computed<CatalogRow[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categories = this.selectedCategories();
    const min = this.minPrice();
    const max = this.maxPrice();

    const filtered = this.rows().filter((row) => {
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

    const order = this.sortOrder();
    if (order === 'none') {
      return filtered;
    }
    const sorted = [...filtered].sort((a, b) => a.product.unitPrice - b.product.unitPrice);
    return order === 'asc' ? sorted : sorted.reverse();
  });

  readonly activeFilterCount = computed<number>(() => {
    let count = this.selectedCategories().size;
    if (this.searchTerm().trim().length > 0) count += 1;
    if (this.minPrice() !== null) count += 1;
    if (this.maxPrice() !== null) count += 1;
    if (this.sortOrder() !== 'none') count += 1;
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

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortOrder.set(value === 'asc' || value === 'desc' ? value : 'none');
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
    this.minPriceText.set((event.target as HTMLInputElement).value);
  }

  onMaxPriceInput(event: Event): void {
    this.maxPriceText.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategories.set(new Set<string>());
    this.minPriceText.set('');
    this.maxPriceText.set('');
    this.sortOrder.set('none');
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

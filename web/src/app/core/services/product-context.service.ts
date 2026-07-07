import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Product } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductContextService {
  private readonly http = inject(HttpClient);
  readonly products = signal<Product[]>([]);
  private loadedForBusinessId: string | null = null;

  loadForBusiness(businessId: string | null) {
    if (!businessId) {
      this.products.set([]);
      this.loadedForBusinessId = null;
      return;
    }
    this.http
      .get<ApiResponse<Product[]>>(`${environment.apiUrl}/businesses/${businessId}/products`)
      .subscribe({
        next: (res) => {
          this.products.set(res.data ?? []);
          this.loadedForBusinessId = businessId;
        },
        error: () => {
          this.products.set([]);
          this.loadedForBusinessId = businessId;
        },
      });
  }

  invalidate() {
    this.loadedForBusinessId = null;
  }

  resolveId(value?: string | null): string {
    const raw = (value ?? '').trim();
    if (!raw) return '';
    const match = this.products().find((p) => p.id === raw);
    return match?.id ?? raw;
  }
}

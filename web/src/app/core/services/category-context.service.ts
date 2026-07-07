import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Category } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoryContextService {
  private readonly http = inject(HttpClient);
  readonly categories = signal<Category[]>([]);
  private loadedForBusinessId: string | null = null;

  loadForBusiness(businessId: string | null) {
    if (!businessId) {
      this.categories.set([]);
      this.loadedForBusinessId = null;
      return;
    }
    this.http
      .get<ApiResponse<Category[]>>(`${environment.apiUrl}/businesses/${businessId}/categories`)
      .subscribe({
        next: (res) => {
          this.categories.set(res.data ?? []);
          this.loadedForBusinessId = businessId;
        },
        error: () => {
          this.categories.set([]);
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
    const match = this.categories().find((c) => c.id === raw);
    return match?.id ?? raw;
  }
}

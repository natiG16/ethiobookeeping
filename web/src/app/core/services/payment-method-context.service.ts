import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { mediaUrl } from '../utils/media-url';
import {
  PAYMENT_METHODS,
  PaymentMethodOption,
  findPaymentMethod,
  isBuiltInPaymentMethod,
} from '../../shared/payment-methods';

export interface BusinessPaymentMethod {
  id: string;
  name: string;
  sortOrder?: number;
  logoUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentMethodContextService {
  private readonly http = inject(HttpClient);
  readonly methods = signal<PaymentMethodOption[]>([...PAYMENT_METHODS]);
  private loadedForBusinessId: string | null = null;

  loadForBusiness(businessId: string | null) {
    if (!businessId) {
      this.methods.set([...PAYMENT_METHODS]);
      this.loadedForBusinessId = null;
      return;
    }
    this.http
      .get<ApiResponse<BusinessPaymentMethod[]>>(
        `${environment.apiUrl}/businesses/${businessId}/payment-methods`
      )
      .subscribe({
        next: (res) => {
          const list = (res.data ?? []).map((m) => this.toOption(m));
          this.methods.set(this.sortMethods(list.length ? list : [...PAYMENT_METHODS]));
          this.loadedForBusinessId = businessId;
        },
        error: () => {
          this.methods.set([...PAYMENT_METHODS]);
          this.loadedForBusinessId = businessId;
        },
      });
  }

  invalidate() {
    this.loadedForBusinessId = null;
  }

  /** Icon URL for dropdowns — only built-in logos or uploaded custom logos. */
  iconSrcFor(method: PaymentMethodOption): string | undefined {
    if (method.logoUrl) {
      return mediaUrl(method.logoUrl) ?? undefined;
    }
    if (method.builtIn) {
      return method.logo || undefined;
    }
    return undefined;
  }

  iconFallbackFor(method: PaymentMethodOption): string | undefined {
    if (method.logoUrl || !method.builtIn) {
      return undefined;
    }
    return method.logoFallback || undefined;
  }

  useLetterIcon(method: PaymentMethodOption): boolean {
    return !method.builtIn && !method.logoUrl;
  }

  /** Canonical payment method name for API filters (matches transaction.paymentMethod). */
  resolveFilterValue(value?: string | null): string {
    const raw = (value ?? '').trim();
    if (!raw) return '';
    const list = this.methods();
    const match = list.find(
      (m) => m.id.toLowerCase() === raw.toLowerCase() || m.label.toLowerCase() === raw.toLowerCase()
    );
    return match?.id ?? match?.label ?? raw;
  }

  private sortMethods(list: PaymentMethodOption[]): PaymentMethodOption[] {
    const builtins = list.filter((m) => m.builtIn);
    const custom = list.filter((m) => !m.builtIn);
    return [...builtins, ...custom];
  }

  private toOption(m: BusinessPaymentMethod): PaymentMethodOption {
    const builtIn = findPaymentMethod(m.name);
    if (builtIn) {
      return {
        ...builtIn,
        id: m.name,
        label: m.name,
        builtIn: true,
        logoUrl: m.logoUrl ?? null,
      };
    }
    const slug = m.name.toLowerCase().replace(/\s+/g, '-');
    return {
      id: m.name,
      labelKey: `payment.custom.${slug}`,
      label: m.name,
      builtIn: false,
      logo: '',
      logoFallback: '',
      logoUrl: m.logoUrl ?? null,
    };
  }
}

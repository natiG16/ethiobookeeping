import { Component, computed, inject, input } from '@angular/core';

import { LocaleService } from '../core/services/locale.service';
import { PaymentMethodContextService } from '../core/services/payment-method-context.service';
import { findPaymentMethod } from './payment-methods';
import { PaymentMethodLogoComponent } from './payment-method-logo.component';

@Component({
  selector: 'app-payment-method-badge',
  standalone: true,
  imports: [PaymentMethodLogoComponent],
  template: `
    @if (raw()) {
      <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <app-payment-method-logo
          [methodId]="raw()!"
          [logoUrl]="resolvedLogoUrl()"
          [alt]="label()"
          size="sm"
        />
        <span>{{ label() }}</span>
      </span>
    }
  `,
})
export class PaymentMethodBadgeComponent {
  private readonly locale = inject(LocaleService);
  private readonly paymentContext = inject(PaymentMethodContextService);

  readonly raw = input<string | undefined>('');

  readonly resolvedLogoUrl = computed(() => {
    const value = this.raw();
    if (!value) return null;
    const fromApi = this.paymentContext.methods().find(
      (m) => m.id === value || m.label.toLowerCase() === value.toLowerCase()
    );
    return fromApi?.logoUrl ?? null;
  });

  label(): string {
    const m = findPaymentMethod(this.raw());
    if (!m) return this.raw() || '—';
    const t = this.locale.t(m.labelKey);
    return t === m.labelKey ? m.label : t;
  }
}

import { Component, computed, effect, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocaleService } from '../core/services/locale.service';
import { PaymentMethodContextService } from '../core/services/payment-method-context.service';
import { PAYMENT_METHODS } from './payment-methods';
import { ElegantSelectComponent, ElegantSelectOption } from './elegant-select.component';

@Component({
  selector: 'app-payment-method-select',
  standalone: true,
  imports: [ElegantSelectComponent, FormsModule],
  template: `
    <app-elegant-select
      [label]="label()"
      [placeholder]="optional() ? locale.t('transactions.filterAllPayments') : locale.t('payment.selectMethod')"
      [options]="selectOptions()"
      [size]="compact() ? 'sm' : 'md'"
      [placement]="compact() ? 'below' : 'above'"
      [disabled]="disabled()"
      [ngModel]="innerValue"
      (ngModelChange)="onPick($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodSelectComponent),
      multi: true,
    },
  ],
})
export class PaymentMethodSelectComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly optional = input(false);
  readonly compact = input(false);
  readonly locale = inject(LocaleService);
  private readonly paymentMethods = inject(PaymentMethodContextService);

  readonly selectOptions = computed((): ElegantSelectOption[] => {
    const methods = this.paymentMethods.methods().map((m) => {
      const letterOnly = this.paymentMethods.useLetterIcon(m);
      return {
        value: m.id,
        label: this.displayLabel(m),
        iconSrc: letterOnly ? undefined : this.paymentMethods.iconSrcFor(m),
        iconFallbackSrc: letterOnly ? undefined : this.paymentMethods.iconFallbackFor(m),
      };
    });
    if (this.optional()) {
      return [
        {
          value: '',
          label: this.locale.t('transactions.filterAllPayments'),
        },
        ...methods,
      ];
    }
    return methods.length
      ? methods
      : PAYMENT_METHODS.map((m) => ({
          value: m.id,
          label: this.displayLabel(m),
          iconSrc: this.paymentMethods.iconSrcFor(m),
          iconFallbackSrc: this.paymentMethods.iconFallbackFor(m),
        }));
  });

  innerValue = '';
  readonly disabled = signal(false);
  private pendingValue: string | null = null;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      this.paymentMethods.methods();
      this.applyValue(this.pendingValue ?? this.innerValue);
    });
  }

  displayLabel(method: { labelKey: string; label: string }): string {
    const t = this.locale.t(method.labelKey);
    return t === method.labelKey ? method.label : t;
  }

  onPick(id: string) {
    this.innerValue = id;
    this.pendingValue = id;
    this.onChange(id);
    this.onTouched();
  }

  writeValue(v: string | null): void {
    this.pendingValue = v;
    this.applyValue(v);
  }

  private applyValue(v: string | null): void {
    const list = this.paymentMethods.methods();
    if (this.optional()) {
      if (!v || v === '') {
        this.innerValue = '';
        return;
      }
      const match =
        list.find((m) => m.id === v || m.label === v) ??
        PAYMENT_METHODS.find((m) => m.id === v || m.label === v);
      const resolved = match?.id ?? v;
      if (resolved !== this.innerValue) {
        this.innerValue = resolved;
      }
      return;
    }
    const match =
      list.find((m) => m.id === v || m.label === v) ??
      list[0] ??
      PAYMENT_METHODS.find((m) => m.id === v || m.label === v) ??
      PAYMENT_METHODS[0];
    const resolved = match?.id ?? v ?? '';
    if (resolved === this.innerValue) {
      return;
    }
    this.innerValue = resolved;
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

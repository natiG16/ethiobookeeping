import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocaleService } from '../core/services/locale.service';
import { ElegantSelectComponent, ElegantSelectOption } from './elegant-select.component';

@Component({
  selector: 'app-transaction-type-select',
  standalone: true,
  imports: [ElegantSelectComponent, FormsModule],
  template: `
    <app-elegant-select
      [label]="label()"
      [placeholder]="placeholder()"
      [options]="selectOptions()"
      [disabled]="disabled()"
      [ngModel]="innerValue"
      (ngModelChange)="onPick($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TransactionTypeSelectComponent),
      multi: true,
    },
  ],
})
export class TransactionTypeSelectComponent implements ControlValueAccessor {
  private readonly locale = inject(LocaleService);

  readonly label = input('');
  readonly optional = input(false);
  readonly placeholder = input('');

  readonly selectOptions = computed((): ElegantSelectOption[] => {
    const opts: ElegantSelectOption[] = [
      {
        value: 'INCOME',
        label: `↑ ${this.locale.t('transactions.income')}`,
      },
      {
        value: 'EXPENSE',
        label: `↓ ${this.locale.t('transactions.expense')}`,
      },
    ];
    if (this.optional()) {
      return [
        {
          value: '',
          label: this.placeholder() || this.locale.t('transactions.filterAllTypes'),
        },
        ...opts,
      ];
    }
    return opts;
  });

  innerValue = '';
  readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  onPick(v: string) {
    this.innerValue = v;
    this.onChange(v);
    this.onTouched();
  }

  writeValue(v: string | null): void {
    this.innerValue = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
    if (!this.optional() || this.innerValue) {
      fn(this.innerValue);
    }
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

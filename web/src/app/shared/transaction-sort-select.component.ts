import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocaleService } from '../core/services/locale.service';
import { ElegantSelectComponent, ElegantSelectOption } from './elegant-select.component';

export type TransactionSortKey = 'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc' | 'createdDesc';

@Component({
  selector: 'app-transaction-sort-select',
  standalone: true,
  imports: [ElegantSelectComponent, FormsModule],
  template: `
    <app-elegant-select
      [label]="label()"
      [options]="selectOptions()"
      [disabled]="disabled()"
      size="sm"
      [ngModel]="innerValue"
      (ngModelChange)="onPick($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TransactionSortSelectComponent),
      multi: true,
    },
  ],
})
export class TransactionSortSelectComponent implements ControlValueAccessor {
  private readonly locale = inject(LocaleService);

  readonly label = input('');

  readonly selectOptions = computed((): ElegantSelectOption[] => [
    { value: 'dateDesc', label: this.locale.t('transactions.sortDateDesc') },
    { value: 'dateAsc', label: this.locale.t('transactions.sortDateAsc') },
    { value: 'amountDesc', label: this.locale.t('transactions.sortAmountDesc') },
    { value: 'amountAsc', label: this.locale.t('transactions.sortAmountAsc') },
    { value: 'createdDesc', label: this.locale.t('transactions.sortCreatedDesc') },
  ]);

  innerValue: TransactionSortKey = 'dateDesc';
  readonly disabled = signal(false);

  private onChange: (v: TransactionSortKey) => void = () => {};
  private onTouched: () => void = () => {};

  onPick(v: string) {
    this.innerValue = v as TransactionSortKey;
    this.onChange(this.innerValue);
    this.onTouched();
  }

  writeValue(v: TransactionSortKey | null): void {
    this.innerValue = v ?? 'dateDesc';
  }

  registerOnChange(fn: (v: TransactionSortKey) => void): void {
    this.onChange = fn;
    fn(this.innerValue);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

import { Component, computed, effect, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoryContextService } from '../core/services/category-context.service';
import { LocaleService } from '../core/services/locale.service';
import { ElegantSelectComponent, ElegantSelectOption } from './elegant-select.component';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [ElegantSelectComponent, FormsModule],
  template: `
    <app-elegant-select
      [label]="label()"
      [placeholder]="optional() ? locale.t('transactions.noCategory') : locale.t('transactions.selectCategory')"
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
      useExisting: forwardRef(() => CategorySelectComponent),
      multi: true,
    },
  ],
})
export class CategorySelectComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly optional = input(false);
  readonly compact = input(false);
  readonly locale = inject(LocaleService);
  private readonly categoryContext = inject(CategoryContextService);

  readonly selectOptions = computed((): ElegantSelectOption[] => {
    const cats = this.categoryContext.categories().map((c) => ({
      value: c.id,
      label: c.name,
    }));
    if (this.optional()) {
      return [{ value: '', label: this.locale.t('transactions.noCategory') }, ...cats];
    }
    return cats;
  });

  innerValue = '';
  readonly disabled = signal(false);
  private pendingValue: string | null = null;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      this.categoryContext.categories();
      this.applyValue(this.pendingValue ?? this.innerValue);
    });
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
    if (this.optional()) {
      if (!v || v === '') {
        this.innerValue = '';
        return;
      }
      const resolved = this.categoryContext.resolveId(v);
      if (resolved !== this.innerValue) {
        this.innerValue = resolved;
      }
      return;
    }
    const resolved = v ? this.categoryContext.resolveId(v) : '';
    if (resolved !== this.innerValue) {
      this.innerValue = resolved;
    }
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

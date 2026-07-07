import { DatePipe } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DateRangeValue {
  from: string;
  to: string;
}

type PresetId = 'all' | '7d' | '30d' | 'month';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  template: `
    <div class="date-range-block">
      @if (label()) {
        <p class="input-label">{{ label() }}</p>
      }

      <div class="date-range-presets" role="group" [attr.aria-label]="label()">
        @for (p of presets; track p.id) {
          <button
            type="button"
            class="date-range-preset"
            [class.date-range-preset-active]="activePreset() === p.id"
            (click)="applyPreset(p.id)"
          >
            {{ p.label }}
          </button>
        }
      </div>

      <div class="date-range-card">
        <div class="date-range-field">
          <span class="date-range-field-label">{{ fromLabel() }}</span>
          <button type="button" class="date-range-picker" (click)="openFromPicker()">
            <span class="date-range-picker-text" [class.date-range-picker-placeholder]="!from()">
              {{ displayFrom() }}
            </span>
            <svg class="date-range-picker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            #fromInput
            type="date"
            class="date-range-native"
            [value]="from()"
            (change)="onFromNative($event)"
          />
        </div>

        <span class="date-range-separator" aria-hidden="true">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>

        <div class="date-range-field">
          <span class="date-range-field-label">{{ toLabel() }}</span>
          <button type="button" class="date-range-picker" (click)="openToPicker()">
            <span class="date-range-picker-text" [class.date-range-picker-placeholder]="!to()">
              {{ displayTo() }}
            </span>
            <svg class="date-range-picker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            #toInput
            type="date"
            class="date-range-native"
            [value]="to()"
            (change)="onToNative($event)"
          />
        </div>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DateRangeFilterComponent,
      multi: true,
    },
  ],
})
export class DateRangeFilterComponent implements ControlValueAccessor {
  private readonly datePipe = new DatePipe('en-US');

  readonly fromInput = viewChild<ElementRef<HTMLInputElement>>('fromInput');
  readonly toInput = viewChild<ElementRef<HTMLInputElement>>('toInput');

  readonly label = input<string | undefined>(undefined);
  readonly fromLabel = input('From');
  readonly toLabel = input('To');
  readonly placeholder = input('Select date');

  readonly presetAll = input('All time');
  readonly preset7d = input('Last 7 days');
  readonly preset30d = input('Last 30 days');
  readonly presetMonth = input('This month');

  readonly from = signal('');
  readonly to = signal('');
  readonly activePreset = signal<PresetId>('all');

  readonly rangeChange = output<DateRangeValue>();

  private onChange: (v: DateRangeValue) => void = () => {};
  private onTouched: () => void = () => {};

  get presets(): { id: PresetId; label: string }[] {
    return [
      { id: 'all', label: this.presetAll() },
      { id: '7d', label: this.preset7d() },
      { id: '30d', label: this.preset30d() },
      { id: 'month', label: this.presetMonth() },
    ];
  }

  displayFrom(): string {
    return this.formatDisplay(this.from()) || this.placeholder();
  }

  displayTo(): string {
    return this.formatDisplay(this.to()) || this.placeholder();
  }

  openFromPicker() {
    const el = this.fromInput()?.nativeElement;
    if (el?.showPicker) {
      el.showPicker();
    } else {
      el?.click();
    }
  }

  openToPicker() {
    const el = this.toInput()?.nativeElement;
    if (el?.showPicker) {
      el.showPicker();
    } else {
      el?.click();
    }
  }

  onFromNative(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.from.set(v);
    this.activePreset.set('all');
    this.emit();
  }

  onToNative(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.to.set(v);
    this.activePreset.set('all');
    this.emit();
  }

  applyPreset(id: PresetId) {
    this.activePreset.set(id);
    const today = new Date();
    if (id === 'all') {
      this.from.set('');
      this.to.set('');
    } else if (id === '7d') {
      this.from.set(this.isoDaysAgo(today, 6));
      this.to.set(this.isoDate(today));
    } else if (id === '30d') {
      this.from.set(this.isoDaysAgo(today, 29));
      this.to.set(this.isoDate(today));
    } else if (id === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      this.from.set(this.isoDate(start));
      this.to.set(this.isoDate(today));
    }
    this.emit();
  }

  writeValue(v: DateRangeValue | null): void {
    this.from.set(v?.from ?? '');
    this.to.set(v?.to ?? '');
    this.activePreset.set(v?.from || v?.to ? 'all' : 'all');
  }

  registerOnChange(fn: (v: DateRangeValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    /* optional */
  }

  private emit() {
    const value = { from: this.from(), to: this.to() };
    this.onChange(value);
    this.onTouched();
    this.rangeChange.emit(value);
  }

  private formatDisplay(iso: string): string {
    if (!iso) return '';
    const d = this.datePipe.transform(iso, 'mediumDate');
    return d ?? iso;
  }

  private isoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private isoDaysAgo(from: Date, days: number): string {
    const d = new Date(from);
    d.setDate(d.getDate() - days);
    return this.isoDate(d);
  }
}

import {
  afterNextRender,
  Component,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocaleService } from '../core/services/locale.service';
import {
  ethiopianToGregorianIso,
  gregorianIsoToEthiopian,
  todayGregorianIso,
} from '../core/utils/ethiopian-calendar';

function ethiopianDatePickerCtor(): typeof EthiopianDatePicker | undefined {
  return (window as unknown as { EthiopianDatePicker?: typeof EthiopianDatePicker })
    .EthiopianDatePicker;
}

@Component({
  selector: 'app-ethiopian-date-picker',
  standalone: true,
  template: `
    @if (label()) {
      <label class="input-label" [attr.for]="fieldId">{{ label() }}</label>
    }
    <div class="app-date-picker-host">
      <input
        #dateInput
        [id]="fieldId"
        type="text"
        class="input-field app-date-picker-input"
        readonly
        [disabled]="disabled()"
        [placeholder]="locale.t('transactions.pickDate')"
      />
      <span class="app-date-picker-trigger app-date-picker-trigger-static" aria-hidden="true">
        <svg class="app-date-picker-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
      @if (loadError()) {
        <p class="mt-1 text-xs text-red-600">{{ loadError() }}</p>
      }
      @if (optional() && hasValue()) {
        <button
          type="button"
          class="app-date-picker-clear"
          [disabled]="disabled()"
          (click)="clear($event)"
          [attr.aria-label]="locale.t('calendar.clear')"
        >
          ×
        </button>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EthiopianDatePickerComponent),
      multi: true,
    },
  ],
})
export class EthiopianDatePickerComponent implements ControlValueAccessor, OnDestroy {
  readonly locale = inject(LocaleService);
  private readonly injector = inject(Injector);
  private readonly dateInputRef = viewChild.required<ElementRef<HTMLInputElement>>('dateInput');

  readonly label = input('');
  readonly optional = input(false);
  readonly fieldId = `et-date-${Math.random().toString(36).slice(2, 9)}`;

  readonly disabled = signal(false);
  readonly hasValue = signal(false);
  readonly loadError = signal('');

  private picker: EthiopianDatePicker | null = null;
  private pendingIso: string | null | undefined = undefined;
  private currentIso = '';

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    afterNextRender(
      () => {
        this.initPicker(this.pendingIso ?? null);
        this.pendingIso = undefined;
      },
      { injector: this.injector }
    );
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
    this.picker = null;
  }

  private initPicker(iso: string | null): void {
    const Ctor = ethiopianDatePickerCtor();
    if (!Ctor) {
      this.loadError.set('Date picker failed to load. Restart the dev server.');
      console.error('EthiopianDatePicker is not on window — check angular.json scripts.');
      return;
    }

    this.loadError.set('');
    this.picker?.destroy();
    const el = this.dateInputRef().nativeElement;
    const loc = this.locale.locale() === 'am' ? 'am' : 'en';

    this.picker = new Ctor(el, {
      locale: loc,
      highlightHolidays: true,
      showTodayButton: true,
      onChange: (date) => {
        const isoValue = ethiopianToGregorianIso(date.ethiopian);
        this.currentIso = isoValue;
        this.hasValue.set(true);
        this.onChange(isoValue);
        this.onTouched();
      },
    });

    this.applyIso(iso);
  }

  private applyIso(v: string | null): void {
    const el = this.dateInputRef().nativeElement;
    if (!v?.trim()) {
      if (this.optional()) {
        el.value = '';
        this.hasValue.set(false);
        this.currentIso = '';
        return;
      }
      const today = gregorianIsoToEthiopian(todayGregorianIso());
      this.picker?.setDate(today.year, today.month, today.day);
      this.currentIso = todayGregorianIso();
      this.hasValue.set(true);
      return;
    }

    const et = gregorianIsoToEthiopian(v.slice(0, 10));
    this.picker?.setDate(et.year, et.month, et.day);
    this.currentIso = v.slice(0, 10);
    this.hasValue.set(true);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.applyIso(null);
    this.onChange('');
    this.onTouched();
  }

  writeValue(v: string | null): void {
    if (!this.picker) {
      this.pendingIso = v;
      return;
    }
    this.applyIso(v);
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
    if (!this.optional() && this.hasValue()) {
      fn(this.currentIso);
    }
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    const el = this.dateInputRef();
    if (el) {
      el.nativeElement.disabled = isDisabled;
    }
  }
}

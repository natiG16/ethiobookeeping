import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LocaleService } from '../core/services/locale.service';
import {
  addGregorianMonths,
  buildGregorianMonthGrid,
  formatGregorianDate,
  gregorianMonthName,
  gregorianMonthOptions,
  parseGregorianIso,
  toGregorianIso,
  todayGregorianIso,
  weekdayLabels,
} from '../core/utils/ethiopian-calendar';
import { positionFloatingPicker } from '../core/utils/ethiopian-datepicker-patch';

type CalendarView = 'days' | 'months' | 'years';

@Component({
  selector: 'app-gregorian-date-picker',
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
        [value]="displayText()"
        [placeholder]="locale.t('transactions.pickDate')"
        (click)="openPicker($event)"
        (focus)="openPicker($event)"
      />
      <span class="app-date-picker-trigger app-date-picker-trigger-static" aria-hidden="true">
        <svg class="app-date-picker-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
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

    @if (open()) {
      <div
        #popup
        class="ethio-datepicker"
        [class.open]="popupVisible()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="locale.t('transactions.pickDate')"
        (click)="$event.stopPropagation()"
      >
        <div class="ethio-datepicker-header">
          <button type="button" class="ethio-nav-btn prev" (click)="navigatePrev()" aria-label="Previous">
            ‹
          </button>
          <div class="ethio-month-year" (click)="onHeaderClick($event)">
            @if (view() === 'years') {
              <span class="year-range">{{ yearRangeStart() }} - {{ yearRangeEnd() }}</span>
            } @else if (view() === 'months') {
              <span class="year-segment">{{ viewYear() }}</span>
            } @else {
              <span class="month-segment">{{ monthLabel() }}</span>
              <span class="year-segment">{{ viewYear() }}</span>
            }
          </div>
          <button type="button" class="ethio-nav-btn next" (click)="navigateNext()" aria-label="Next">
            ›
          </button>
        </div>

        <div class="ethio-calendar-grid">
          @if (view() === 'days') {
            <div class="ethio-day-headers">
              @for (label of weekdayLabels(); track label) {
                <div class="ethio-day-header">{{ label }}</div>
              }
            </div>
            <div class="ethio-days">
              @for (day of dayGrid(); track $index) {
                @if (day === null) {
                  <span class="ethio-day empty" aria-hidden="true"></span>
                } @else {
                  <button
                    type="button"
                    class="ethio-day"
                    [class.today]="isToday(day)"
                    [class.selected]="isSelected(day)"
                    (click)="selectDay(day)"
                  >
                    {{ day }}
                  </button>
                }
              }
            </div>
          } @else if (view() === 'months') {
            <div class="ethio-month-grid">
              @for (month of monthOptions(); track month.value) {
                <button
                  type="button"
                  class="ethio-month-cell"
                  [class.selected]="month.value === viewMonth()"
                  (click)="selectMonth(month.value)"
                >
                  {{ month.label }}
                </button>
              }
            </div>
          } @else {
            <div class="ethio-year-grid">
              @for (year of yearOptions(); track year) {
                <button
                  type="button"
                  class="ethio-year-cell"
                  [class.selected]="year === viewYear()"
                  (click)="selectYear(year)"
                >
                  {{ year }}
                </button>
              }
            </div>
          }
        </div>

        <div class="ethio-datepicker-footer">
          <button type="button" class="ethio-today-btn" (click)="selectToday()">
            {{ locale.t('calendar.today') }}
          </button>
          <button type="button" class="ethio-close-btn" (click)="closePicker()">
            {{ locale.t('calendar.close') }}
          </button>
        </div>
      </div>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GregorianDatePickerComponent),
      multi: true,
    },
  ],
})
export class GregorianDatePickerComponent implements ControlValueAccessor {
  readonly locale = inject(LocaleService);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly dateInputRef = viewChild<ElementRef<HTMLInputElement>>('dateInput');
  private readonly popupRef = viewChild<ElementRef<HTMLElement>>('popup');

  readonly label = input('');
  readonly optional = input(false);
  readonly fieldId = `gr-date-${Math.random().toString(36).slice(2, 9)}`;

  readonly disabled = signal(false);
  readonly hasValue = signal(false);
  readonly open = signal(false);
  readonly popupVisible = signal(false);
  readonly view = signal<CalendarView>('days');
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth() + 1);

  private currentIso = '';
  private pendingIso: string | null | undefined = undefined;
  private popupPortaled = false;
  private popupHost: HTMLElement | null = null;
  private repositionHandler: (() => void) | null = null;
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly weekdayLabels = computed(() => weekdayLabels(this.locale.locale()));
  readonly monthOptions = computed(() => gregorianMonthOptions(this.locale.locale()));
  readonly dayGrid = computed(() => buildGregorianMonthGrid(this.viewYear(), this.viewMonth()));
  readonly monthLabel = computed(() => gregorianMonthName(this.viewMonth(), this.locale.locale()));
  readonly yearRangeStart = computed(() => this.viewYear() - 12);
  readonly yearRangeEnd = computed(() => this.viewYear() + 12);
  readonly yearOptions = computed(() => {
    const start = this.yearRangeStart();
    const end = this.yearRangeEnd();
    const years: number[] = [];
    for (let y = start; y <= end; y++) {
      years.push(y);
    }
    return years;
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => {
          this.portalPopup();
          this.positionPopup();
          this.bindPopupListeners();
          requestAnimationFrame(() => {
            if (this.open()) {
              this.popupVisible.set(true);
              this.positionPopup();
            }
          });
        });
      } else {
        this.popupVisible.set(false);
        this.unbindPopupListeners();
        this.restorePopup();
      }
    });

    afterNextRender(
      () => {
        if (this.pendingIso !== undefined) {
          this.applyIso(this.pendingIso);
          this.pendingIso = undefined;
        }
      },
      { injector: this.injector }
    );

    this.destroyRef.onDestroy(() => {
      this.unbindPopupListeners();
      this.restorePopup();
    });
  }

  displayText(): string {
    if (!this.currentIso) {
      return '';
    }
    return formatGregorianDate(this.currentIso);
  }

  openPicker(event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) {
      return;
    }
    if (!this.currentIso) {
      const today = parseGregorianIso(todayGregorianIso());
      if (today) {
        this.viewYear.set(today.year);
        this.viewMonth.set(today.month);
      }
    } else {
      const parts = parseGregorianIso(this.currentIso);
      if (parts) {
        this.viewYear.set(parts.year);
        this.viewMonth.set(parts.month);
      }
    }
    this.view.set('days');
    this.open.set(true);
  }

  closePicker(): void {
    this.open.set(false);
  }

  navigatePrev(): void {
    if (this.view() === 'years') {
      this.viewYear.update((y) => y - 25);
      return;
    }
    if (this.view() === 'months') {
      this.viewYear.update((y) => y - 1);
      return;
    }
    const next = addGregorianMonths(this.viewYear(), this.viewMonth(), -1);
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
  }

  navigateNext(): void {
    if (this.view() === 'years') {
      this.viewYear.update((y) => y + 25);
      return;
    }
    if (this.view() === 'months') {
      this.viewYear.update((y) => y + 1);
      return;
    }
    const next = addGregorianMonths(this.viewYear(), this.viewMonth(), 1);
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
  }

  onHeaderClick(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.classList.contains('month-segment')) {
      this.view.set('months');
      return;
    }
    if (target.classList.contains('year-segment') || target.classList.contains('year-range')) {
      this.view.set('years');
    }
  }

  selectDay(day: number): void {
    const iso = toGregorianIso(this.viewYear(), this.viewMonth(), day);
    this.setValue(iso);
    this.onChange(iso);
    this.onTouched();
    setTimeout(() => this.closePicker(), 200);
  }

  selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.view.set('days');
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.view.set('months');
  }

  selectToday(): void {
    const today = todayGregorianIso();
    const parts = parseGregorianIso(today);
    if (!parts) {
      return;
    }
    this.viewYear.set(parts.year);
    this.viewMonth.set(parts.month);
    this.view.set('days');
    this.setValue(today);
    this.onChange(today);
    this.onTouched();
    setTimeout(() => this.closePicker(), 200);
  }

  isToday(day: number): boolean {
    const today = parseGregorianIso(todayGregorianIso());
    return (
      !!today &&
      today.year === this.viewYear() &&
      today.month === this.viewMonth() &&
      today.day === day
    );
  }

  isSelected(day: number): boolean {
    const selected = parseGregorianIso(this.currentIso);
    return (
      !!selected &&
      selected.year === this.viewYear() &&
      selected.month === this.viewMonth() &&
      selected.day === day
    );
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.applyIso(null);
    this.onChange('');
    this.onTouched();
  }

  writeValue(v: string | null): void {
    if (!this.dateInputRef()) {
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
    if (isDisabled) {
      this.closePicker();
    }
  }

  private setValue(iso: string): void {
    this.currentIso = iso.slice(0, 10);
    this.hasValue.set(!!this.currentIso);
  }

  private applyIso(v: string | null): void {
    if (!v?.trim()) {
      if (this.optional()) {
        this.currentIso = '';
        this.hasValue.set(false);
        return;
      }
      const today = todayGregorianIso();
      this.setValue(today);
      return;
    }
    this.setValue(v);
    const parts = parseGregorianIso(this.currentIso);
    if (parts) {
      this.viewYear.set(parts.year);
      this.viewMonth.set(parts.month);
    }
  }

  private portalPopup(): void {
    const popup = this.popupRef()?.nativeElement;
    if (!popup || popup.parentElement === this.doc.body) {
      return;
    }
    this.popupHost = popup.parentElement;
    this.doc.body.appendChild(popup);
    this.popupPortaled = true;
  }

  private restorePopup(): void {
    const popup = this.popupRef()?.nativeElement;
    if (!this.popupPortaled || !popup || !this.popupHost) {
      return;
    }
    if (popup.parentElement === this.doc.body) {
      this.popupHost.appendChild(popup);
    }
    this.popupPortaled = false;
    this.popupHost = null;
  }

  private positionPopup(): void {
    const input = this.dateInputRef()?.nativeElement;
    const popup = this.popupRef()?.nativeElement;
    if (!input || !popup) {
      return;
    }
    positionFloatingPicker(input, popup);
  }

  private bindPopupListeners(): void {
    this.unbindPopupListeners();

    const reposition = () => {
      if (this.open()) {
        this.positionPopup();
      }
    };
    this.repositionHandler = reposition;
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    const onOutsideClick = (e: MouseEvent) => {
      const input = this.dateInputRef()?.nativeElement;
      const popup = this.popupRef()?.nativeElement;
      const target = e.target as Node;
      if (
        this.open() &&
        popup &&
        !popup.contains(target) &&
        target !== input
      ) {
        this.closePicker();
      }
    };
    this.outsideClickHandler = onOutsideClick;
    this.doc.addEventListener('click', onOutsideClick);
  }

  private unbindPopupListeners(): void {
    if (this.repositionHandler) {
      window.removeEventListener('scroll', this.repositionHandler, true);
      window.removeEventListener('resize', this.repositionHandler);
      this.repositionHandler = null;
    }
    if (this.outsideClickHandler) {
      this.doc.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }
}

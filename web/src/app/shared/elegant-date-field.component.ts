import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-elegant-date-field',
  standalone: true,
  template: `
    @if (label()) {
      <label class="input-label" [attr.for]="inputId">{{ label() }}</label>
    }
    <div class="date-field-wrap">
      <svg
        class="date-field-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <input
        [id]="inputId"
        type="date"
        class="date-field-input"
        [class.date-field-input-sm]="size() === 'sm'"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ElegantDateFieldComponent),
      multi: true,
    },
  ],
})
export class ElegantDateFieldComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly size = input<'sm' | 'md'>('md');
  readonly inputId = `date-${Math.random().toString(36).slice(2, 9)}`;

  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.value = v;
    this.onChange(v);
  }

  writeValue(v: string | null): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

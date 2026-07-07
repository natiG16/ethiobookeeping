import { Component, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarPreferenceService } from '../core/services/calendar-preference.service';
import { EthiopianDatePickerComponent } from './ethiopian-date-picker.component';
import { GregorianDatePickerComponent } from './gregorian-date-picker.component';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [FormsModule, EthiopianDatePickerComponent, GregorianDatePickerComponent],
  template: `
    @if (calendar.isEthiopian()) {
      <app-ethiopian-date-picker
        [label]="label()"
        [optional]="optional()"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [name]="fieldId + '-eth'"
      />
    } @else {
      <app-gregorian-date-picker
        [label]="label()"
        [optional]="optional()"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [name]="fieldId + '-gr'"
      />
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePickerComponent),
      multi: true,
    },
  ],
})
export class AppDatePickerComponent implements ControlValueAccessor {
  readonly calendar = inject(CalendarPreferenceService);

  readonly label = input('');
  readonly optional = input(false);
  readonly fieldId = `app-date-${Math.random().toString(36).slice(2, 9)}`;

  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value?.slice(0, 10) ?? '';
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

  onValueChange(v: string): void {
    this.value = v?.slice(0, 10) ?? '';
    this.onChange(this.value);
  }
}

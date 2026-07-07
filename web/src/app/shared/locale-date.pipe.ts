import { Pipe, PipeTransform, inject } from '@angular/core';
import { CalendarPreferenceService } from '../core/services/calendar-preference.service';
import { LocaleService } from '../core/services/locale.service';
import { formatDisplayDate } from '../core/utils/ethiopian-calendar';

@Pipe({ name: 'localeDate', standalone: true, pure: false })
export class LocaleDatePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);
  private readonly calendar = inject(CalendarPreferenceService);

  transform(value: string | undefined | null): string {
    return formatDisplayDate(value, this.calendar.calendarSystem(), this.locale.locale());
  }
}

declare module '@bekim_2121/ethiopian-datepicker/dist/ethiopian-datepicker.js' {
  export class EthiopianCalendar {
    gregorianToEthiopian(date: Date): { year: number; month: number; day: number; weekDay: number };
    ethiopianToGregorian(year: number, month: number, day: number): Date;
    getMonthDays(year: number, month: number): unknown[];
    holidays: unknown[];
    isHoliday(month: number, day: number): unknown;
  }

  export class EthiopianDatePicker {
    constructor(input: HTMLElement | string, options?: EthiopianDatePickerOptions);
    destroy(): void;
    setDate(year: number, month: number, day: number): void;
    getSelectedDate(): { year: number; month: number; day: number } | null;
    open(): void;
    close(): void;
  }

  export class EthiopianCalendar {
    gregorianToEthiopian(date: Date): { year: number; month: number; day: number };
    ethiopianToGregorian(year: number, month: number, day: number): Date;
  }

  export class EthiopianTimePicker {
    constructor(input: HTMLElement | string, options?: Record<string, unknown>);
    destroy(): void;
  }
}

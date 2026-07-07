interface EthiopianDatePickerChange {
  ethiopian: { year: number; month: number; day: number };
  gregorian: Date;
  formatted: string;
}

interface EthiopianDatePickerOptions {
  locale?: 'am' | 'en';
  minDate?: Date | null;
  maxDate?: Date | null;
  highlightHolidays?: boolean;
  showTodayButton?: boolean;
  darkMode?: boolean;
  onChange?: (date: EthiopianDatePickerChange) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

declare class EthiopianDatePicker {
  constructor(input: HTMLElement | string, options?: EthiopianDatePickerOptions);
  destroy(): void;
  setDate(year: number, month: number, day: number): void;
  getSelectedDate(): { year: number; month: number; day: number } | null;
  open(): void;
  close(): void;
}

declare class EthiopianCalendar {
  gregorianToEthiopian(date: Date): { year: number; month: number; day: number };
  ethiopianToGregorian(year: number, month: number, day: number): Date;
}

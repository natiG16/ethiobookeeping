import {
  ethiopianToGregorianParts,
  gregorianIsoToEthiopian,
  gregorianPartsToEthiopian,
  todayGregorianIso,
} from './ethiopian-calendar';
import { holidaysForEthiopianYear } from './ethiopian-orthodox-holidays';

type EthiopianCalendarClass = {
  prototype: {
    gregorianToEthiopian(date: Date): { year: number; month: number; day: number; weekDay: number };
    today?(): { year: number; month: number; day: number; weekDay: number };
    ethiopianToGregorian(year: number, month: number, day: number): Date;
    getMonthDays(
      year: number,
      month: number
    ): Array<{
      day: number;
      weekDay: number;
      gregorianDate: Date;
      isHoliday: boolean;
      holidayName: { am: string; en: string } | null;
    } | null>;
    holidays: unknown[];
    isHoliday(month: number, day: number): unknown;
  };
};

/** Fix library calendar drift and replace incorrect fixed holiday dates. */
export function patchEthiopianDatePickerLibrary(EthiopianCalendar: EthiopianCalendarClass): void {
  const proto = EthiopianCalendar.prototype;

  proto.gregorianToEthiopian = function (gregorianDate: Date) {
    const et = gregorianPartsToEthiopian(
      gregorianDate.getFullYear(),
      gregorianDate.getMonth() + 1,
      gregorianDate.getDate()
    );
    return { ...et, weekDay: gregorianDate.getDay() };
  };

  proto.today = function () {
    const iso = todayGregorianIso();
    const et = gregorianIsoToEthiopian(iso);
    const [y, m, d] = iso.split('-').map(Number);
    return { ...et, weekDay: new Date(y, m - 1, d).getDay() };
  };

  proto.ethiopianToGregorian = function (ethYear: number, ethMonth: number, ethDay: number) {
    const g = ethiopianToGregorianParts({ year: ethYear, month: ethMonth, day: ethDay });
    return new Date(g.year, g.month - 1, g.day, 12, 0, 0, 0);
  };

  proto.holidays = [];

  const originalGetMonthDays = proto.getMonthDays;
  proto.getMonthDays = function (year: number, month: number) {
    const days = originalGetMonthDays.call(this, year, month);
    const holidays = holidaysForEthiopianYear(year);
    for (const cell of days) {
      if (!cell?.day) {
        continue;
      }
      const match = holidays.find((h) => h.month === month && h.day === cell.day);
      cell.isHoliday = !!match;
      cell.holidayName = match?.name ?? null;
    }
    return days;
  };

  proto.isHoliday = function () {
    return undefined;
  };
}

export type DatePickerInstance = {
  input: HTMLElement;
  container: HTMLElement;
  isOpen: boolean;
  positionPicker(): void;
  open(): void;
  close(): void;
};

const PICKER_FALLBACK_HEIGHT = 380;
const PICKER_FALLBACK_WIDTH = 320;
const VIEWPORT_PAD = 8;
const PICKER_GAP = 6;

export function positionFloatingPicker(input: HTMLElement, container: HTMLElement): void {
  const rect = input.getBoundingClientRect();
  const height = container.offsetHeight || PICKER_FALLBACK_HEIGHT;
  const width = container.offsetWidth || PICKER_FALLBACK_WIDTH;

  let top = rect.bottom + PICKER_GAP;
  const spaceBelow = window.innerHeight - rect.bottom - PICKER_GAP;
  const spaceAbove = rect.top - PICKER_GAP;

  if (spaceBelow < height && spaceAbove > spaceBelow) {
    top = rect.top - height - PICKER_GAP;
  } else if (top + height > window.innerHeight - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, window.innerHeight - height - VIEWPORT_PAD);
  }
  top = Math.max(VIEWPORT_PAD, top);

  let left = rect.left;
  if (left + width > window.innerWidth - VIEWPORT_PAD) {
    left = window.innerWidth - width - VIEWPORT_PAD;
  }
  left = Math.max(VIEWPORT_PAD, left);

  container.style.position = 'fixed';
  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
  container.style.right = 'auto';
  container.style.bottom = 'auto';
  container.style.zIndex = '12000';
}

function positionPickerInViewport(this: DatePickerInstance): void {
  positionFloatingPicker(this.input, this.container);
}

/** Keep calendar visible in modals and near viewport edges. */
type EthiopianDatePickerProto = DatePickerInstance & {
  footer: HTMLElement;
  options: { locale?: string; onChange?: (date: EthiopianDatePickerChange) => void };
  selectedDate: { year: number; month: number; day: number } | null;
  calendar: { ethiopianToGregorian(y: number, m: number, d: number): Date; formatDate(y: number, m: number, d: number, locale: string): string };
  daysContainer: HTMLElement;
  selectDate(year: number, month: number, day: number): void;
  attachEventListeners(): void;
  updateInputValue(): void;
  renderDays(): void;
  handleKeyboard(e: KeyboardEvent): void;
};

/**
 * Stop the calendar from flashing closed on open (input click was bubbling to document).
 * Still closes after a day is chosen, on outside click, or via Close.
 */
export function patchEthiopianDatePickerInteraction(DatePickerCtor: { prototype: EthiopianDatePickerProto }): void {
  const proto = DatePickerCtor.prototype;
  const originalSelectDate = proto.selectDate;

  proto.selectDate = function (year: number, month: number, day: number) {
    originalSelectDate.call(this, year, month, day);
  };

  proto.attachEventListeners = function () {
    const openPicker = (e: Event) => {
      e.stopPropagation();
      this.open();
    };
    this.input.addEventListener('click', openPicker);
    this.input.addEventListener('focus', openPicker);

    document.addEventListener('click', (e) => {
      if (
        this.isOpen &&
        !this.container.contains(e.target as Node) &&
        e.target !== this.input
      ) {
        this.close();
      }
    });

    this.container.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyboard(e));
    window.addEventListener('scroll', () => {
      if (this.isOpen) {
        this.positionPicker();
      }
    });
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.positionPicker();
      }
    });
  };
}

export function patchEthiopianDatePickerPosition(DatePickerCtor: {
  prototype: DatePickerInstance;
}): void {
  const proto = DatePickerCtor.prototype;
  const originalOpen = proto.open;
  const originalClose = proto.close;

  proto.positionPicker = positionPickerInViewport;

  proto.open = function (this: DatePickerInstance) {
    originalOpen.call(this);
    const reposition = () => {
      if (this.isOpen) {
        positionPickerInViewport.call(this);
      }
    };
    requestAnimationFrame(() => {
      reposition();
      requestAnimationFrame(reposition);
    });
    (this as DatePickerInstance & { _reposition?: () => void })._reposition = reposition;
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  };

  proto.close = function (this: DatePickerInstance) {
    const inst = this as DatePickerInstance & { _reposition?: () => void };
    if (inst._reposition) {
      document.removeEventListener('scroll', inst._reposition, true);
      window.removeEventListener('resize', inst._reposition);
      inst._reposition = undefined;
    }
    originalClose.call(this);
  };
}

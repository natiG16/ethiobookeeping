export interface EthiopianDateParts {
  year: number;
  month: number;
  day: number;
}

const MONTHS_EN = [
  '',
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagumen',
];

const MONTHS_AM = [
  '',
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
];

/** Ethiopian calendar epoch in Julian day number (Amete Mihret 1, Meskerem 1). */
const ETHIOPIAN_EPOCH = 1723856;

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function mod(i: number, j: number): number {
  return i - j * Math.floor(i / j);
}

/** Beyene–Kudlek: Gregorian JDN → Ethiopian civil date. */
function jdnToEthiopian(jdn: number): EthiopianDateParts {
  const r = mod(jdn - ETHIOPIAN_EPOCH, 1461);
  const n = mod(r, 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = mod(n, 30) + 1;
  return { year, month, day };
}

function ethiopianToJdn(parts: EthiopianDateParts): number {
  return (
    ETHIOPIAN_EPOCH +
    365 * parts.year +
    Math.floor(parts.year / 4) +
    30 * (parts.month - 1) +
    parts.day -
    1
  );
}

export function gregorianPartsToEthiopian(
  year: number,
  month: number,
  day: number
): EthiopianDateParts {
  return jdnToEthiopian(gregorianToJdn(year, month, day));
}

export function ethiopianToGregorianParts(parts: EthiopianDateParts): {
  year: number;
  month: number;
  day: number;
} {
  return jdnToGregorian(ethiopianToJdn(parts));
}

/** Gregorian calendar date for “today” in Ethiopia (matches backend JDBC timezone). */
export function todayGregorianIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function gregorianIsoToEthiopian(iso: string): EthiopianDateParts {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return gregorianPartsToEthiopian(y, m, d);
}

export function ethiopianToGregorianIso(parts: EthiopianDateParts): string {
  const g = ethiopianToGregorianParts(parts);
  const m = String(g.month).padStart(2, '0');
  const d = String(g.day).padStart(2, '0');
  return `${g.year}-${m}-${d}`;
}

export function ethiopianMonthName(month: number, locale: 'en' | 'am'): string {
  const names = locale === 'am' ? MONTHS_AM : MONTHS_EN;
  return names[month] ?? String(month);
}

export function ethiopianMonthOptions(locale: 'en' | 'am'): { value: number; label: string }[] {
  return Array.from({ length: 13 }, (_, i) => {
    const m = i + 1;
    return { value: m, label: ethiopianMonthName(m, locale) };
  });
}

export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

export function daysInEthiopianMonth(year: number, month: number): number {
  if (month < 13) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

export function ethiopianYearOptions(centerYear?: number): number[] {
  const y = centerYear ?? gregorianIsoToEthiopian(todayGregorianIso()).year;
  const years: number[] = [];
  for (let i = y - 15; i <= y + 2; i++) {
    years.push(i);
  }
  return years;
}

export function formatEthiopianDate(iso: string | undefined | null, locale: 'en' | 'am'): string {
  if (!iso) return '—';
  try {
    const et = gregorianIsoToEthiopian(iso.slice(0, 10));
    const month = ethiopianMonthName(et.month, locale);
    return `${month} ${et.day}, ${et.year}`;
  } catch {
    return iso;
  }
}

export function formatGregorianDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const part = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    return iso;
  }
  const [y, m, d] = part.split('-').map(Number);
  const month = new Date(y, m - 1, d).toLocaleString('en-US', { month: 'short' });
  return `${month} ${d}, ${y}`;
}

export function formatDisplayDate(
  iso: string | undefined | null,
  calendar: 'ethiopian' | 'gregorian',
  locale: 'en' | 'am'
): string {
  if (calendar === 'gregorian') {
    return formatGregorianDate(iso);
  }
  return formatEthiopianDate(iso, locale);
}

const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_AM = ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ'];

export function weekdayLabels(locale: 'en' | 'am'): string[] {
  return locale === 'am' ? WEEKDAYS_AM : WEEKDAYS_EN;
}

/** 0 = Sunday … 6 = Saturday for the 1st of the given Ethiopian month. */
export function firstWeekdayOfEthiopianMonth(year: number, month: number): number {
  const iso = ethiopianToGregorianIso({ year, month, day: 1 });
  return new Date(`${iso}T12:00:00`).getDay();
}

export function buildEthiopianMonthGrid(year: number, month: number): (number | null)[] {
  const days = daysInEthiopianMonth(year, month);
  const start = firstWeekdayOfEthiopianMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= days; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function addEthiopianMonths(year: number, month: number, delta: number): { year: number; month: number } {
  let y = year;
  let m = month + delta;
  while (m < 1) {
    m += 13;
    y -= 1;
  }
  while (m > 13) {
    m -= 13;
    y += 1;
  }
  return { year: y, month: m };
}

export function daysInGregorianMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function firstWeekdayOfGregorianMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function buildGregorianMonthGrid(year: number, month: number): (number | null)[] {
  const days = daysInGregorianMonth(year, month);
  const start = firstWeekdayOfGregorianMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= days; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function addGregorianMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function gregorianMonthName(month: number, locale: 'en' | 'am'): string {
  return new Date(2000, month - 1, 1).toLocaleString(locale === 'am' ? 'am-ET' : 'en-US', {
    month: 'long',
  });
}

export function parseGregorianIso(iso: string): { year: number; month: number; day: number } | null {
  const part = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    return null;
  }
  const [year, month, day] = part.split('-').map(Number);
  return { year, month, day };
}

export function toGregorianIso(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function gregorianMonthOptions(locale: 'en' | 'am'): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: m, label: gregorianMonthName(m, locale) };
  });
}

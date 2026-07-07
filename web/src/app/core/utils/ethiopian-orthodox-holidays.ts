import {
  ethiopianToGregorianParts,
  EthiopianDateParts,
  gregorianPartsToEthiopian,
} from './ethiopian-calendar';

export interface EthiopianHoliday {
  month: number;
  day: number;
  name: { am: string; en: string };
}

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

function jdnToEthiopian(jdn: number): EthiopianDateParts {
  const r = jdn - ETHIOPIAN_EPOCH;
  const year = Math.floor((4 * r + 3) / 1461);
  const dayOfYear = r - Math.floor((1461 * year) / 4);
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;
  return { year, month, day };
}

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Ethiopian Orthodox Easter (Fasika) as a Gregorian date. */
function orthodoxEasterGregorian(gregorianYear: number): { year: number; month: number; day: number } {
  const a = gregorianYear % 4;
  const b = gregorianYear % 7;
  const c = gregorianYear % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const jMonth = Math.floor((d + e + 114) / 31);
  const jDay = ((d + e + 114) % 31) + 1;
  const jdn = gregorianToJdn(gregorianYear, jMonth, jDay) + 13;
  return jdnToGregorian(jdn);
}

function ethiopianAddDays(parts: EthiopianDateParts, days: number): EthiopianDateParts {
  const g = ethiopianToGregorianParts(parts);
  const jdn = gregorianToJdn(g.year, g.month, g.day) + days;
  return jdnToEthiopian(jdn);
}

function holidayFromGregorian(
  gregYear: number,
  gregMonth: number,
  gregDay: number,
  name: { am: string; en: string }
): EthiopianHoliday {
  const et = gregorianPartsToEthiopian(gregYear, gregMonth, gregDay);
  return { month: et.month, day: et.day, name };
}

/**
 * Major Ethiopian Orthodox holidays for an Ethiopian calendar year shown in the picker.
 */
export function holidaysForEthiopianYear(ethYear: number): EthiopianHoliday[] {
  const gregForSpring = ethYear + 8;
  const gregForMeskel = ethYear + 7;
  const meskelDay = isGregorianLeapYear(gregForMeskel) ? 27 : 26;

  const fasikaG = orthodoxEasterGregorian(gregForSpring);
  const fasikaEt = gregorianPartsToEthiopian(fasikaG.year, fasikaG.month, fasikaG.day);
  const sikletEt = ethiopianAddDays(fasikaEt, -2);

  return [
    { month: 1, day: 1, name: { am: 'እንቁጣጣሽ', en: 'Enkutatash (New Year)' } },
    holidayFromGregorian(gregForMeskel, 9, meskelDay, { am: 'መስቀል', en: 'Meskel' }),
    holidayFromGregorian(gregForSpring, 1, 7, { am: 'ገና', en: 'Genna (Christmas)' }),
    holidayFromGregorian(gregForSpring, 1, 19, { am: 'ጥምቀት', en: 'Timkat (Epiphany)' }),
    holidayFromGregorian(gregForSpring, 3, 2, { am: 'የአድዋ ድል', en: 'Adwa Victory Day' }),
    {
      month: sikletEt.month,
      day: sikletEt.day,
      name: { am: 'ስቅለት', en: 'Siklet (Good Friday)' },
    },
    {
      month: fasikaEt.month,
      day: fasikaEt.day,
      name: { am: 'ፋሲካ', en: 'Fasika (Easter)' },
    },
  ];
}

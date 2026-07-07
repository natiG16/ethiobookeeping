import {
  buildGregorianMonthGrid,
  ethiopianToGregorianIso,
  gregorianIsoToEthiopian,
  gregorianPartsToEthiopian,
  toGregorianIso,
} from './ethiopian-calendar';

describe('ethiopian-calendar', () => {
  it('round-trips Gregorian ISO through Ethiopian parts', () => {
    const iso = '2026-06-03';
    const et = gregorianIsoToEthiopian(iso);
    expect(ethiopianToGregorianIso(et)).toBe(iso);
  });

  it('maps 2026-06-03 to Ginbot 26, 2018', () => {
    expect(gregorianPartsToEthiopian(2026, 6, 3)).toEqual({
      year: 2018,
      month: 9,
      day: 26,
    });
  });

  it('maps Ginbot 26, 2018 to 2026-06-03', () => {
    expect(ethiopianToGregorianIso({ year: 2018, month: 9, day: 26 })).toBe('2026-06-03');
  });

  it('builds a Gregorian month grid with leading blanks', () => {
    expect(buildGregorianMonthGrid(2026, 6)[0]).toBeNull();
    expect(buildGregorianMonthGrid(2026, 6)[1]).toBe(1);
    expect(buildGregorianMonthGrid(2026, 6)[30]).toBe(30);
    expect(toGregorianIso(2026, 6, 3)).toBe('2026-06-03');
  });
});

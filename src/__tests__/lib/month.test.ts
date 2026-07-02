import { describe, it, expect } from 'vitest'
import {
  toISODate,
  todayISO,
  currentMonth,
  monthRange,
  shiftMonth,
  formatMonthLabel,
  formatDayLabel,
  lastNDays,
} from '@/lib/month'

describe('toISODate', () => {
  it('formats a Date using local date parts', () => {
    expect(toISODate(new Date(2026, 3, 1))).toBe('2026-04-01')
  })

  it('pads single-digit month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('todayISO', () => {
  it('returns the local date in YYYY-MM-DD', () => {
    const now = new Date()
    expect(todayISO()).toBe(toISODate(now))
  })
})

describe('currentMonth', () => {
  it('returns the local month in YYYY-MM', () => {
    expect(currentMonth()).toBe(todayISO().slice(0, 7))
  })
})

describe('monthRange', () => {
  it('returns the first and last day of a 31-day month', () => {
    expect(monthRange('2026-07')).toEqual({ start: '2026-07-01', end: '2026-07-31' })
  })

  it('returns 28 days for a non-leap February', () => {
    expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('returns 29 days for a leap-year February', () => {
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' })
  })
})

describe('shiftMonth', () => {
  it('moves forward within a year', () => {
    expect(shiftMonth('2026-04', 1)).toBe('2026-05')
  })

  it('moves backward within a year', () => {
    expect(shiftMonth('2026-04', -1)).toBe('2026-03')
  })

  it('wraps backward across a year boundary', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('wraps forward across a year boundary', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
})

describe('formatMonthLabel', () => {
  it('formats YYYY-MM as a zh-TW label without zero padding', () => {
    expect(formatMonthLabel('2026-04')).toBe('2026 年 4 月')
  })

  it('keeps two-digit months intact', () => {
    expect(formatMonthLabel('2026-11')).toBe('2026 年 11 月')
  })
})

describe('formatDayLabel', () => {
  it('formats YYYY-MM-DD as M/D', () => {
    expect(formatDayLabel('2026-04-01')).toBe('4/1')
  })

  it('drops zero padding from month and day', () => {
    expect(formatDayLabel('2026-12-25')).toBe('12/25')
  })
})

describe('lastNDays', () => {
  it('returns n consecutive dates ending today', () => {
    const days = lastNDays(14)
    expect(days).toHaveLength(14)
    expect(days[13]).toBe(todayISO())
  })

  it('returns dates in ascending order', () => {
    const days = lastNDays(3)
    expect([...days].sort()).toEqual(days)
  })
})

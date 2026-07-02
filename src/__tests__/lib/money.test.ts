import { describe, it, expect } from 'vitest'
import { formatMoney, formatSignedMoney } from '@/lib/money'

describe('formatMoney', () => {
  it('formats a number with NT$ prefix and zh-TW thousands separators', () => {
    expect(formatMoney(1000)).toBe('NT$ 1,000')
  })

  it('coerces numeric strings before formatting', () => {
    expect(formatMoney('2500')).toBe('NT$ 2,500')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('NT$ 0')
  })

  it('keeps the negative sign for negative amounts', () => {
    expect(formatMoney(-500)).toBe('NT$ -500')
  })
})

describe('formatSignedMoney', () => {
  it('prefixes topup amounts with +', () => {
    expect(formatSignedMoney(15000, 'topup')).toBe('+NT$ 15,000')
  })

  it('prefixes expense amounts with -', () => {
    expect(formatSignedMoney(500, 'expense')).toBe('-NT$ 500')
  })

  it('coerces numeric strings', () => {
    expect(formatSignedMoney('300', 'expense')).toBe('-NT$ 300')
  })
})

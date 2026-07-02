import { describe, it, expect } from 'vitest'
import { CATEGORY_PALETTE, FALLBACK_CATEGORY, paletteForCategoryName } from '@/lib/tokens'

describe('paletteForCategoryName', () => {
  it('returns a palette entry for a non-empty name', () => {
    const entry = paletteForCategoryName('餐飲')
    expect(CATEGORY_PALETTE).toContainEqual(entry)
  })

  it('is deterministic for the same name', () => {
    expect(paletteForCategoryName('交通')).toEqual(paletteForCategoryName('交通'))
  })

  it('falls back for null, undefined, and empty names', () => {
    expect(paletteForCategoryName(null)).toEqual(FALLBACK_CATEGORY)
    expect(paletteForCategoryName(undefined)).toEqual(FALLBACK_CATEGORY)
    expect(paletteForCategoryName('')).toEqual(FALLBACK_CATEGORY)
  })
})

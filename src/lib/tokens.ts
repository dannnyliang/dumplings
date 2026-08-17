export const FALLBACK_CATEGORY = { bg: '#E8E3DB', fg: '#6B5A48', emoji: '•' }

export const CATEGORY_PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: '#F5E1C8', fg: '#8B5A2B' },
  { bg: '#E8DFD1', fg: '#6B5A48' },
  { bg: '#DCE5DC', fg: '#4A6B4F' },
  { bg: '#EADBE8', fg: '#7A4E78' },
  { bg: '#F2D6D0', fg: '#8A4A3E' },
  { bg: '#DDE4EE', fg: '#4A5A78' },
  { bg: '#E8E3DB', fg: '#6B5A48' },
  { bg: '#F0E8D4', fg: '#7A6040' },
]

/** 分類未指定顏色時，依名稱決定一個穩定的調色盤項目（「自動（依名稱）」）。 */
export function paletteForCategoryName(name: string | null | undefined): { bg: string; fg: string } {
  if (!name) return FALLBACK_CATEGORY
  const hash = [...name].reduce((acc, ch) => acc + (ch.codePointAt(0) ?? 0), 0)
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length]
}

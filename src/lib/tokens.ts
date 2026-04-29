export const CATEGORY_COLORS: Record<string, { bg: string; fg: string; emoji: string }> = {
  '餐飲': { bg: '#F5E1C8', fg: '#8B5A2B', emoji: '🍜' },
  '日用品': { bg: '#E8DFD1', fg: '#6B5A48', emoji: '🧴' },
  '交通': { bg: '#DCE5DC', fg: '#4A6B4F', emoji: '🚌' },
  '娛樂': { bg: '#EADBE8', fg: '#7A4E78', emoji: '🎬' },
  '購物': { bg: '#F2D6D0', fg: '#8A4A3E', emoji: '🛍' },
  '醫療': { bg: '#DDE4EE', fg: '#4A5A78', emoji: '💊' },
  '其他': { bg: '#E8E3DB', fg: '#6B5A48', emoji: '•' },
}

export const FALLBACK_CATEGORY = CATEGORY_COLORS['其他']

export const WARM_CHART_COLORS = [
  '#B8562B', '#D4A574', '#A88C6B', '#7A6A54', '#B38968', '#C89B7B', '#8B7860',
]

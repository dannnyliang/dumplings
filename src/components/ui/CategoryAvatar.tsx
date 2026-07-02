import { CATEGORY_PALETTE, FALLBACK_CATEGORY, paletteForCategoryName } from '@/lib/tokens'

interface CategoryAvatarProps {
  categoryName?: string | null
  emoji?: string | null
  color?: string | null
  size?: number
}

export default function CategoryAvatar({ categoryName, emoji, color, size = 40 }: CategoryAvatarProps) {
  const colors = color
    ? (CATEGORY_PALETTE.find(p => p.bg === color) ?? FALLBACK_CATEGORY)
    : paletteForCategoryName(categoryName)
  const radius = Math.round(size * 0.25)
  const fontSize = Math.round(size * 0.46)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colors.bg,
        color: colors.fg,
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {emoji ?? FALLBACK_CATEGORY.emoji}
    </div>
  )
}

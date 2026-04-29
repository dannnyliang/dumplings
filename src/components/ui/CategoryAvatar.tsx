import { CATEGORY_COLORS, FALLBACK_CATEGORY } from '@/lib/tokens'

interface CategoryAvatarProps {
  categoryName: string | null | undefined
  size?: number
}

export default function CategoryAvatar({ categoryName, size = 40 }: CategoryAvatarProps) {
  const colors = (categoryName && CATEGORY_COLORS[categoryName]) ?? FALLBACK_CATEGORY
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
      {colors.emoji}
    </div>
  )
}

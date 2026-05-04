'use client'

import { useState } from 'react'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import { CATEGORY_PALETTE } from '@/lib/tokens'

export interface CategoryFormData {
  name: string
  emoji: string | null
  color: string | null
}

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = '儲存',
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [emoji, setEmoji] = useState(initialData?.emoji ?? '')
  const [color, setColor] = useState<string | null>(initialData?.color ?? null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSubmit({ name: name.trim(), emoji: emoji.trim() || null, color })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Preview + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CategoryAvatar
          categoryName={name || null}
          emoji={emoji || null}
          color={color}
          size={44}
        />
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="分類名稱"
          style={{
            flex: 1,
            border: 'none',
            borderBottom: '1.5px solid var(--dmp-accent)',
            outline: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--dmp-text)',
            padding: '4px 0',
          }}
        />
      </div>

      {/* Emoji */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--dmp-text-muted)', minWidth: 32 }}>圖示</span>
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          maxLength={2}
          placeholder="😀"
          style={{
            width: 44,
            height: 44,
            textAlign: 'center',
            fontSize: 22,
            border: '1.5px solid var(--dmp-border-strong)',
            borderRadius: 12,
            background: 'var(--dmp-surface-alt)',
            outline: 'none',
            color: 'var(--dmp-text)',
          }}
        />
      </div>

      {/* Color palette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--dmp-text-muted)', minWidth: 32 }}>顏色</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setColor(null)}
            title="自動（依名稱）"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: color === null
                ? '2.5px solid var(--dmp-accent)'
                : '1.5px solid var(--dmp-border-strong)',
              background: 'var(--dmp-surface-alt)',
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--dmp-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            自
          </button>
          {CATEGORY_PALETTE.map(p => (
            <button
              key={p.bg}
              type="button"
              onClick={() => setColor(p.bg)}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: p.bg,
                border: color === p.bg
                  ? `2.5px solid ${p.fg}`
                  : '1.5px solid transparent',
                boxShadow: color === p.bg ? `0 0 0 1px ${p.fg}` : 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: '1px solid var(--dmp-border-strong)',
            borderRadius: 12,
            padding: '8px 16px',
            fontSize: 14,
            color: 'var(--dmp-text-muted)',
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          style={{
            background: 'var(--dmp-accent)',
            color: '#FFF',
            border: 'none',
            borderRadius: 12,
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !name.trim() ? 0.5 : 1,
          }}
        >
          {loading ? '處理中…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

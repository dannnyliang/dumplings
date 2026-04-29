'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import Toggle from '@/components/ui/Toggle'
import Icon from '@/components/ui/Icon'
import type { Category } from '@/types/database'

interface CategoryManagerProps {
  initialCategories: Category[]
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCategories = categories.filter((c) => c.is_active)
  const inactiveCategories = categories.filter((c) => !c.is_active)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setAdding(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('請重新登入')
      setAdding(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (insertError || !data) {
      setError('新增失敗')
    } else {
      setCategories((prev) => [...prev, data as Category])
      setNewName('')
    }
    setAdding(false)
  }

  async function toggleActive(category: Category) {
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (updateError) {
      setError('更新失敗')
      return
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: !c.is_active } : c))
    )
    router.refresh()
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`確定要刪除「${category.name}」？`)) return
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (deleteError) {
      setError('刪除失敗（此分類可能仍有交易紀錄）')
      return
    }
    setCategories((prev) => prev.filter((c) => c.id !== category.id))
  }

  const allCategories = [...activeCategories, ...inactiveCategories]

  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: 'var(--dmp-text-muted)', display: 'flex' }}>
            <Icon name="back" size={22} />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0 }}>分類</h1>
        </div>
        <button
          onClick={() => document.getElementById('new-cat-input')?.focus()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: 'var(--dmp-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="plus" size={18} strokeWidth={2} />
          新增
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input
            id="new-cat-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新分類名稱..."
            style={{
              flex: 1,
              border: '1px solid var(--dmp-border-strong)',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 14,
              color: 'var(--dmp-text)',
              backgroundColor: 'var(--dmp-surface)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            style={{
              backgroundColor: 'var(--dmp-accent)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 14,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: adding || !newName.trim() ? 'not-allowed' : 'pointer',
              opacity: adding || !newName.trim() ? 0.5 : 1,
            }}
          >
            新增
          </button>
        </form>

        {error && <p style={{ fontSize: 12, color: '#B83B3B' }}>{error}</p>}

        {allCategories.length > 0 && (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--dmp-border)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dmp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                全部分類 · {allCategories.length}
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {allCategories.map((c, idx) => (
                <li
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: idx > 0 ? '1px solid var(--dmp-border)' : 'none',
                    opacity: c.is_active ? 1 : 0.55,
                    backgroundColor: c.is_active ? 'transparent' : 'var(--dmp-surface-alt)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CategoryAvatar categoryName={c.name} size={36} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: c.is_active ? 'var(--dmp-text)' : 'var(--dmp-text-muted)' }}>
                      {c.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.created_by && (
                      <button
                        onClick={() => deleteCategory(c)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 4 }}
                        aria-label="刪除"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                    <Toggle
                      checked={c.is_active}
                      onChange={() => toggleActive(c)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}

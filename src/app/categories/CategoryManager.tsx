'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserId } from '@/lib/supabase/auth'
import { createCategory, deleteCategory as deleteCategoryRow, updateCategory } from '@/lib/repos/categories'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import Toggle from '@/components/ui/Toggle'
import Icon from '@/components/ui/Icon'
import CategoryForm, { type CategoryFormData } from './CategoryForm'
import type { Category } from '@/types/database'

interface CategoryManagerProps {
  initialCategories: Category[]
}

type FormMode = 'none' | 'add' | string // string = category id being edited

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [formMode, setFormMode] = useState<FormMode>('none')
  const [error, setError] = useState<string | null>(null)

  function closeForm() {
    setFormMode('none')
    setError(null)
  }

  async function handleAdd(data: CategoryFormData) {
    setError(null)
    const supabase = createClient()
    const userId = await getUserId(supabase)
    if (!userId) { setError('請重新登入'); return }

    const { data: inserted, error: insertError } = await createCategory(supabase, {
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      created_by: userId,
    })

    if (insertError || !inserted) {
      setError('新增失敗')
      return
    }
    setCategories(prev => [...prev, inserted as Category])
    closeForm()
  }

  async function handleEdit(category: Category, data: CategoryFormData) {
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await updateCategory(supabase, category.id, {
      name: data.name,
      emoji: data.emoji,
      color: data.color,
    })

    if (updateError) { setError('更新失敗'); return }
    setCategories(prev =>
      prev.map(c => c.id === category.id ? { ...c, ...data } : c)
    )
    closeForm()
    router.refresh()
  }

  async function toggleActive(category: Category) {
    const supabase = createClient()
    const { error: updateError } = await updateCategory(supabase, category.id, {
      is_active: !category.is_active,
    })

    if (updateError) { setError('更新失敗'); return }
    setCategories(prev =>
      prev.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c)
    )
    router.refresh()
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`確定要刪除「${category.name}」？`)) return
    const supabase = createClient()
    const { error: deleteError } = await deleteCategoryRow(supabase, category.id)

    if (deleteError) { setError('刪除失敗（此分類可能仍有交易紀錄）'); return }
    setCategories(prev => prev.filter(c => c.id !== category.id))
  }

  const sorted = [...categories].sort((a, b) => a.created_at.localeCompare(b.created_at))

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
          <Link href="/settings" aria-label="回設定" style={{ color: 'var(--dmp-text-muted)', display: 'flex' }}>
            <Icon name="back" size={22} />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0 }}>分類</h1>
        </div>
        <button
          onClick={() => setFormMode(f => f === 'add' ? 'none' : 'add')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 14, fontWeight: 500,
            color: formMode === 'add' ? 'var(--dmp-text-muted)' : 'var(--dmp-accent)',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <Icon name={formMode === 'add' ? 'close' : 'plus'} size={18} strokeWidth={2} />
          {formMode === 'add' ? '取消' : '新增'}
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Add form */}
        {formMode === 'add' && (
          <div style={{
            backgroundColor: 'var(--dmp-surface)',
            borderRadius: 20,
            padding: '20px 16px',
            boxShadow: 'var(--dmp-shadow-soft)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--dmp-text-muted)', marginBottom: 16, marginTop: 0 }}>
              新增分類
            </p>
            <CategoryForm
              submitLabel="新增"
              onSubmit={handleAdd}
              onCancel={closeForm}
            />
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: '#B83B3B', margin: 0 }}>{error}</p>}

        {sorted.length > 0 && (
          <div style={{
            backgroundColor: 'var(--dmp-surface)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: 'var(--dmp-shadow-soft)',
          }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--dmp-border)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dmp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                全部分類 · {sorted.length}
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sorted.map((c, idx) => (
                <li
                  key={c.id}
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--dmp-border)' : 'none',
                    opacity: c.is_active ? 1 : 0.55,
                    backgroundColor: c.is_active ? 'transparent' : 'var(--dmp-surface-alt)',
                  }}
                >
                  {formMode === c.id ? (
                    <div style={{ padding: '16px' }}>
                      <CategoryForm
                        initialData={{ name: c.name, emoji: c.emoji ?? '', color: c.color }}
                        onSubmit={data => handleEdit(c, data)}
                        onCancel={closeForm}
                      />
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CategoryAvatar categoryName={c.name} emoji={c.emoji} color={c.color} size={36} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: c.is_active ? 'var(--dmp-text)' : 'var(--dmp-text-muted)' }}>
                          {c.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={() => setFormMode(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 4 }}
                          aria-label="編輯"
                        >
                          <Icon name="pencil" size={15} />
                        </button>
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
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}

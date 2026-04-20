'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</Link>
        <h1 className="text-lg font-bold text-gray-800">分類管理</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 shadow-sm flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新分類名稱..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition"
          >
            新增
          </button>
        </form>

        {error && <p className="text-xs text-red-500 px-1">{error}</p>}

        {activeCategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">使用中</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {activeCategories.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{c.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(c)}
                      className="text-xs text-orange-500 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50 transition"
                    >
                      停用
                    </button>
                    {c.created_by && (
                      <button
                        onClick={() => deleteCategory(c)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {inactiveCategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">已停用</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {inactiveCategories.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3 opacity-50">
                  <span className="text-sm text-gray-600">{c.name}</span>
                  <button
                    onClick={() => toggleActive(c)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                  >
                    啟用
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}

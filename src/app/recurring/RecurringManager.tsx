'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category, RecurringTransaction } from '@/types/database'

interface RecurringManagerProps {
  initialRecurring: RecurringTransaction[]
  categories: Pick<Category, 'id' | 'name'>[]
  userId: string
}

const TODAY = new Date().toISOString().split('T')[0]

const FREQ_LABEL: Record<string, string> = {
  monthly: '每月',
  weekly: '每週',
}

export default function RecurringManager({ initialRecurring, categories, userId }: RecurringManagerProps) {
  const router = useRouter()
  const [recurring, setRecurring] = useState(initialRecurring)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  const [type, setType] = useState<'expense' | 'topup'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [paidBy, setPaidBy] = useState<'shared' | 'self'>('shared')
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) { setError('請輸入有效金額'); return }

    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('recurring_transactions')
      .insert({
        amount: parsedAmount,
        type,
        category_id: type === 'expense' ? categoryId || null : null,
        note: note.trim() || null,
        paid_by: type === 'expense' && paidBy === 'self' ? userId : 'shared',
        frequency,
        day_of_month: frequency === 'monthly' ? Number(dayOfMonth) : null,
        created_by: userId,
      })
      .select('*, category:categories(id, name)')
      .single()

    if (insertError || !data) {
      setError('新增失敗')
    } else {
      setRecurring((prev) => [data as RecurringTransaction, ...prev])
      setShowForm(false)
      setAmount('')
      setNote('')
    }
    setSubmitting(false)
  }

  async function triggerNow(item: RecurringTransaction) {
    setTriggering(item.id)
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        date: TODAY,
        note: item.note,
        paid_by: item.paid_by,
        created_by: userId,
      })

    if (insertError) {
      setError('記帳失敗')
    } else {
      router.refresh()
    }
    setTriggering(null)
  }

  async function deactivate(item: RecurringTransaction) {
    if (!confirm(`確定要停用「${item.category?.name ?? '此定期'}」？`)) return
    const supabase = createClient()
    await supabase
      .from('recurring_transactions')
      .update({ is_active: false })
      .eq('id', item.id)
    setRecurring((prev) => prev.filter((r) => r.id !== item.id))
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</Link>
          <h1 className="text-lg font-bold text-gray-800">定期交易</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-indigo-500 hover:text-indigo-700 font-medium"
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {error && <p className="text-xs text-red-500 px-1">{error}</p>}

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-700">新增定期模板</p>

            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['expense', 'topup'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2 text-sm font-medium transition ${type === t ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {t === 'expense' ? '支出' : '入帳'}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-gray-200 rounded-xl px-3">
              <span className="text-gray-400 text-sm mr-1">NT$</span>
              <input type="number" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0" required
                className="flex-1 py-2.5 text-sm text-gray-800 outline-none bg-transparent" />
            </div>

            {type === 'expense' && (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none bg-white">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <div className="flex gap-2">
              <select value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly')}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none bg-white">
                <option value="monthly">每月</option>
                <option value="weekly">每週</option>
              </select>
              {frequency === 'monthly' && (
                <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-1">
                  <input type="number" min="1" max="31" value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="w-10 py-2.5 text-sm text-gray-800 outline-none bg-transparent text-center" />
                  <span className="text-xs text-gray-400">日</span>
                </div>
              )}
            </div>

            {type === 'expense' && (
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['shared', 'self'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPaidBy(p)}
                    className={`flex-1 py-2 text-sm font-medium transition ${paidBy === p ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {p === 'shared' ? '共同帳戶' : '我先墊付'}
                  </button>
                ))}
              </div>
            )}

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none" />

            <button type="submit" disabled={submitting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition">
              {submitting ? '新增中...' : '新增定期模板'}
            </button>
          </form>
        )}

        {recurring.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
            <p className="text-3xl mb-2">🔄</p>
            <p className="text-sm">還沒有定期交易，點右上角新增</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {recurring.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.type === 'topup' ? '💰' : '💸'}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.category?.name ?? (item.type === 'topup' ? '入帳' : '支出')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {FREQ_LABEL[item.frequency]}
                          {item.frequency === 'monthly' && item.day_of_month
                            ? ` ${item.day_of_month} 日`
                            : ''}
                          {item.note ? ` · ${item.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${item.type === 'topup' ? 'text-green-600' : 'text-gray-800'}`}>
                      {item.type === 'topup' ? '+' : '-'}NT$ {Number(item.amount).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => triggerNow(item)}
                      disabled={triggering === item.id}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium py-1.5 rounded-lg disabled:opacity-50 transition"
                    >
                      {triggering === item.id ? '記帳中...' : '今天記一筆'}
                    </button>
                    <button
                      onClick={() => deactivate(item)}
                      className="px-3 text-gray-400 hover:text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      停用
                    </button>
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

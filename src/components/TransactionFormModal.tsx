'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, Transaction } from '@/types/database'

interface TransactionFormModalProps {
  userId: string
  transaction?: Transaction
  onClose: () => void
}

const TODAY = new Date().toISOString().split('T')[0]

export default function TransactionFormModal({
  userId,
  transaction,
  onClose,
}: TransactionFormModalProps) {
  const router = useRouter()
  const isEdit = !!transaction

  const [type, setType] = useState<'expense' | 'topup'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(transaction?.category_id ?? '')
  const [date, setDate] = useState(transaction?.date ?? TODAY)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [paidBy, setPaidBy] = useState<'shared' | 'self'>(
    transaction && transaction.paid_by !== 'shared' ? 'self' : 'shared'
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setCategories(data)
          if (!transaction?.category_id && data[0]) setCategoryId(data[0].id)
        }
      })
  }, [transaction?.category_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('請輸入有效金額')
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      amount: parsedAmount,
      type,
      category_id: type === 'expense' ? categoryId || null : null,
      date,
      note: note.trim() || null,
      paid_by: type === 'expense' && paidBy === 'self' ? userId : 'shared',
    }

    if (isEdit && transaction) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', transaction.id)

      if (updateError) {
        setError('儲存失敗，請再試一次')
        setSubmitting(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({ ...payload, created_by: userId })

      if (insertError) {
        setError('新增失敗，請再試一次')
        setSubmitting(false)
        return
      }
    }

    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!transaction || !confirm('確定要刪除這筆記錄？')) return
    setSubmitting(true)
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id)

    if (deleteError) {
      setError('刪除失敗')
      setSubmitting(false)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      className="fixed inset-0 bg-black/40 z-30 flex items-end justify-center sm:items-center"
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? '編輯記錄' : '新增記錄'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['expense', 'topup'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-medium transition ${
                type === t ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'expense' ? '支出' : '入帳'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* amount */}
          <div>
            <label className="text-xs text-gray-500">金額</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-3 mt-1">
              <span className="text-gray-400 text-sm mr-1">NT$</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="flex-1 py-2.5 text-gray-800 text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          {/* category (expense only) */}
          {type === 'expense' && (
            <div>
              <label className="text-xs text-gray-500">分類</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* date */}
          <div>
            <label className="text-xs text-gray-500">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none"
            />
          </div>

          {/* paid_by (expense only) */}
          {type === 'expense' && (
            <div>
              <label className="text-xs text-gray-500">付款方式</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 mt-1">
                {(['shared', 'self'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPaidBy(p)}
                    className={`flex-1 py-2 text-sm font-medium transition ${
                      paidBy === p ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'shared' ? '共同帳戶' : '我先墊付'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* note */}
          <div>
            <label className="text-xs text-gray-500">備註（選填）</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition"
          >
            {submitting ? '處理中...' : isEdit ? '儲存' : '新增'}
          </button>

          {isEdit && transaction?.created_by === userId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="w-full text-red-400 hover:text-red-600 disabled:opacity-50 py-2 text-sm transition"
            >
              刪除這筆記錄
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

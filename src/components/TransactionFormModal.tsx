'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import { useMutateTransactions } from '@/components/TransactionsMutationContext'
import { todayISO } from '@/lib/month'
import {
  PAYER_FORM_LABELS,
  formKindFromPaidBy,
  isPaidByShared,
  paidByForTransaction,
  type PayerFormKind,
} from '@/lib/paidBy'
import { listActiveCategories } from '@/lib/repos/categories'
import {
  createTransaction,
  deleteTransaction,
  setTransactionReimbursed,
  updateTransaction,
} from '@/lib/repos/transactions'
import type { Category, Transaction } from '@/types/database'

interface TransactionFormModalProps {
  userId: string
  transaction?: Transaction
  onClose: () => void
}

const TODAY = todayISO()

export default function TransactionFormModal({
  userId,
  transaction,
  onClose,
}: TransactionFormModalProps) {
  const mutate = useMutateTransactions()
  const isEdit = !!transaction

  const [type, setType] = useState<'expense' | 'topup'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(transaction?.category_id ?? '')
  const [date, setDate] = useState(transaction?.date ?? TODAY)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [paidBy, setPaidBy] = useState<PayerFormKind>(() =>
    transaction ? formKindFromPaidBy(transaction.paid_by) : 'shared'
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    listActiveCategories(supabase).then(({ data }) => {
      if (data) {
        setCategories(data)
        if (!transaction?.category_id && data[0]) setCategoryId(data[0].id)
      }
    })
  }, [transaction?.category_id])

  const canSave = !!amount && parseFloat(amount) > 0

  function handleSubmit() {
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
      paid_by: paidByForTransaction(type, paidBy, userId),
    }
    const category = payload.category_id
      ? categories.find((c) => c.id === payload.category_id)
      : undefined

    if (isEdit && transaction) {
      const optimistic: Transaction = { ...transaction, ...payload, category }
      mutate({ kind: 'update', transaction: optimistic }, async () => {
        const { error } = await updateTransaction(supabase, transaction.id, payload)
        return { error }
      })
    } else {
      const optimistic: Transaction = {
        id: crypto.randomUUID(),
        ...payload,
        is_reimbursed: false,
        reimbursed_at: null,
        created_by: userId,
        created_at: new Date().toISOString(),
        category,
      }
      mutate({ kind: 'create', transaction: optimistic }, async () => {
        const { error } = await createTransaction(supabase, { ...payload, created_by: userId })
        return { error }
      })
    }

    onClose()
  }

  function handleDelete() {
    if (!transaction) return
    setSubmitting(true)
    const supabase = createClient()
    mutate({ kind: 'delete', id: transaction.id }, async () => {
      const { error } = await deleteTransaction(supabase, transaction.id)
      return { error }
    })
    onClose()
  }

  function handleUnreimburse() {
    if (!transaction) return
    setSubmitting(true)
    const supabase = createClient()
    mutate({ kind: 'reimburse', id: transaction.id, isReimbursed: false }, async () => {
      const { error } = await setTransactionReimbursed(supabase, transaction.id, false)
      return { error }
    })
    onClose()
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 30,
        backgroundColor: 'rgba(30,20,12,0.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'dmp-fade-in 0.2s ease',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--dmp-bg)',
          borderRadius: '28px 28px 0 0',
          width: '100%',
          maxWidth: 480,
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          animation: 'dmp-slide-up 0.28s cubic-bezier(0.3,0.7,0.3,1)',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
      >
        {/* grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: 'var(--dmp-border-strong)' }} />
        </div>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          <button
            onClick={onClose}
            style={{ fontSize: 15, color: 'var(--dmp-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            取消
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--dmp-text)' }}>
            {isEdit ? '編輯記錄' : '新增記錄'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSave}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: canSave && !submitting ? 'var(--dmp-accent)' : 'var(--dmp-text-muted)',
              background: 'none', border: 'none', cursor: canSave && !submitting ? 'pointer' : 'default',
              padding: '4px 0',
            }}
          >
            {submitting ? '處理中' : '儲存'}
          </button>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* type segmented */}
          <div style={{ display: 'flex', backgroundColor: 'var(--dmp-surface-alt)', borderRadius: 14, padding: 3, gap: 3 }}>
            {(['expense', 'topup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 11, border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  backgroundColor: type === t ? 'var(--dmp-surface)' : 'transparent',
                  color: type === t ? 'var(--dmp-text)' : 'var(--dmp-text-muted)',
                  boxShadow: type === t ? '0 1px 4px rgba(30,20,12,0.10)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'expense' ? '支出' : '入帳'}
              </button>
            ))}
          </div>

          {/* amount */}
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--dmp-shadow-soft)' }}>
            <span style={{ fontSize: 18, color: 'var(--dmp-text-muted)', fontFamily: '"SF Mono", ui-monospace, monospace' }}>NT$</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              style={{
                flex: 1, fontSize: 28, fontWeight: 700, color: 'var(--dmp-text)',
                fontFamily: '"SF Mono", ui-monospace, monospace',
                background: 'none', border: 'none', outline: 'none',
              }}
            />
          </div>

          {/* category chips (expense only) */}
          {type === 'expense' && categories.length > 0 && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                {categories.map((c) => {
                  const selected = c.id === categoryId
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '8px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        flexShrink: 0,
                        backgroundColor: selected ? 'var(--dmp-surface)' : 'var(--dmp-surface-alt)',
                        boxShadow: selected ? 'var(--dmp-shadow-soft)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CategoryAvatar emoji={c.emoji} color={c.color} size={36} />
                      <span style={{ fontSize: 11, fontWeight: selected ? 600 : 400, color: selected ? 'var(--dmp-text)' : 'var(--dmp-text-muted)', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* note */}
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 14, padding: '12px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              style={{
                width: '100%', fontSize: 14, color: 'var(--dmp-text)',
                background: 'none', border: 'none', outline: 'none',
              }}
            />
          </div>

          {/* paid_by (expense only) */}
          {type === 'expense' && (
            <div style={{ display: 'flex', backgroundColor: 'var(--dmp-surface-alt)', borderRadius: 14, padding: 3, gap: 3 }}>
              {(['shared', 'self', 'credit_card'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaidBy(p)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 11, border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    backgroundColor: paidBy === p ? 'var(--dmp-accent-soft)' : 'transparent',
                    color: paidBy === p ? 'var(--dmp-accent-text)' : 'var(--dmp-text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {PAYER_FORM_LABELS[p]}
                </button>
              ))}
            </div>
          )}

          {/* date */}
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 14, padding: '12px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%', fontSize: 14, color: 'var(--dmp-text)',
                background: 'none', border: 'none', outline: 'none',
              }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: '#B83B3B', margin: 0 }}>{error}</p>}

          {/* primary CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSave}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 18, border: 'none',
              fontSize: 16, fontWeight: 700, cursor: canSave && !submitting ? 'pointer' : 'not-allowed',
              backgroundColor: canSave && !submitting ? 'var(--dmp-accent)' : 'var(--dmp-surface-alt)',
              color: canSave && !submitting ? '#FFFFFF' : 'var(--dmp-text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            {submitting ? '處理中...' : isEdit ? '儲存變更' : '新增記錄'}
          </button>

          {/* unreimburse (edit only, advance payment already settled) */}
          {isEdit && transaction?.is_reimbursed && !isPaidByShared(transaction.paid_by) && (
            <button
              type="button"
              onClick={handleUnreimburse}
              disabled={submitting}
              style={{ width: '100%', padding: '10px 0', borderRadius: 14, border: '1.5px solid var(--dmp-border-strong)', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'none', color: 'var(--dmp-text-muted)' }}
            >
              還原為「未還清」
            </button>
          )}

          {/* delete (edit only) */}
          {isEdit && (
            confirmDelete ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--dmp-surface-alt)', color: 'var(--dmp-text-muted)' }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', backgroundColor: '#B83B3B', color: '#FFFFFF' }}
                >
                  確認刪除
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
                style={{ width: '100%', padding: '10px 0', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'none', color: '#B83B3B' }}
              >
                刪除這筆記錄
              </button>
            )
          )}

          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  )
}

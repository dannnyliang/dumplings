'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import { useLedgerMutators } from '@/components/TransactionsMutationContext'
import { todayISO } from '@/lib/month'
import {
  PAYMENT_METHOD_SHARED,
  paymentMethodOptionLabel,
  paymentMethodOptions,
} from '@/lib/paymentMethod'
import { listActiveCategories } from '@/lib/repos/categories'
import { createCashMovement } from '@/lib/repos/cashMovements'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/lib/repos/transactions'
import type { CashMovement, Category, Transaction } from '@/types/database'

interface TransactionFormModalProps {
  userId: string
  transaction?: Transaction
  /** server 端預取的 active categories；提供時 sheet 秒開，未提供則 client 端 fallback 抓取。 */
  categories?: Category[]
  /** 付款方式按鈕顯示他人名稱用；未提供時以預設文案顯示。 */
  profiles?: Record<string, string>
  onClose: () => void
}

/** 新增時的類型：支出寫入消費紀錄，入帳寫入現金移動。 */
type EntryKind = 'expense' | 'topup'

const TODAY = todayISO()
/** 下滑超過此距離（px）即關閉，否則彈回。 */
const DISMISS_THRESHOLD = 110
const CLOSE_ANIM_MS = 240
/** 6.3 預設帶入上次使用的付款方式。 */
const LAST_PAYMENT_METHOD_KEY = 'dumplings:lastPaymentMethod'

function readLastPaymentMethod(userId: string): string {
  if (typeof window === 'undefined') return PAYMENT_METHOD_SHARED
  const stored = window.localStorage.getItem(LAST_PAYMENT_METHOD_KEY)
  if (stored && paymentMethodOptions(userId).includes(stored)) return stored
  return PAYMENT_METHOD_SHARED
}

export default function TransactionFormModal({
  userId,
  transaction,
  categories: initialCategories,
  profiles = {},
  onClose,
}: TransactionFormModalProps) {
  const { mutateTransaction, mutateCashMovement } = useLedgerMutators()
  const isEdit = !!transaction

  const [entryKind, setEntryKind] = useState<EntryKind>('expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(
    transaction?.category_id ?? initialCategories?.[0]?.id ?? ''
  )
  const [date, setDate] = useState(transaction?.date ?? TODAY)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [paymentMethod, setPaymentMethod] = useState<string>(() =>
    transaction ? transaction.payment_method : readLastPaymentMethod(userId)
  )
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartYRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const closingRef = useRef(false)

  const methodOptions = paymentMethodOptions(userId, transaction?.payment_method)

  // 統一的關閉路徑：播退場動畫（sheet 滑落 + backdrop 淡出）後才真正卸載。
  function requestClose() {
    if (closingRef.current) return
    closingRef.current = true
    const sheet = sheetRef.current
    const backdrop = backdropRef.current
    if (sheet) {
      sheet.style.transition = `transform ${CLOSE_ANIM_MS}ms cubic-bezier(0.3,0.7,0.3,1)`
      sheet.style.transform = 'translateY(100%)'
    }
    if (backdrop) {
      backdrop.style.transition = `opacity ${CLOSE_ANIM_MS}ms ease`
      backdrop.style.opacity = '0'
    }
    window.setTimeout(onClose, CLOSE_ANIM_MS)
  }

  function handleDragStart(e: React.TouchEvent) {
    if (closingRef.current) return
    dragStartYRef.current = e.touches[0].clientY
    dragOffsetRef.current = 0
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }

  function handleDragMove(e: React.TouchEvent) {
    if (dragStartYRef.current === null) return
    const dy = e.touches[0].clientY - dragStartYRef.current
    dragOffsetRef.current = Math.max(0, dy) // 只允許下滑
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dragOffsetRef.current}px)`
  }

  function handleDragEnd() {
    if (dragStartYRef.current === null) return
    dragStartYRef.current = null
    if (dragOffsetRef.current > DISMISS_THRESHOLD) {
      requestClose()
      return
    }
    // 未達門檻：彈回原位
    const sheet = sheetRef.current
    if (sheet) {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.3,0.7,0.3,1)'
      sheet.style.transform = 'translateY(0)'
    }
  }

  // server 已預取分類時直接秒開；只有沒帶 categories 才 client fallback 抓取。
  useEffect(() => {
    if (initialCategories) return
    const supabase = createClient()
    listActiveCategories(supabase).then(({ data }) => {
      if (data) {
        setCategories(data)
        if (!transaction?.category_id && data[0]) setCategoryId(data[0].id)
      }
    })
  }, [transaction?.category_id, initialCategories])

  const canSave = !!amount && parseFloat(amount) > 0
  const isExpense = isEdit || entryKind === 'expense'

  function submitExpense(parsedAmount: number, supabase: ReturnType<typeof createClient>) {
    const payload = {
      amount: parsedAmount,
      category_id: categoryId || null,
      date,
      note: note.trim() || null,
      payment_method: paymentMethod,
    }
    const category = payload.category_id
      ? categories.find((c) => c.id === payload.category_id)
      : undefined

    if (isEdit && transaction) {
      const optimistic: Transaction = { ...transaction, ...payload, category }
      mutateTransaction({ kind: 'update', record: optimistic }, async () => {
        const { error: updateError } = await updateTransaction(supabase, transaction.id, payload)
        return { error: updateError }
      })
    } else {
      const optimistic: Transaction = {
        id: crypto.randomUUID(),
        ...payload,
        created_by: userId,
        created_at: new Date().toISOString(),
        category,
      }
      mutateTransaction({ kind: 'create', record: optimistic }, async () => {
        const { error: insertError } = await createTransaction(supabase, {
          ...payload,
          created_by: userId,
        })
        return { error: insertError }
      })
    }

    window.localStorage.setItem(LAST_PAYMENT_METHOD_KEY, paymentMethod)
  }

  function submitTopup(parsedAmount: number, supabase: ReturnType<typeof createClient>) {
    const payload = {
      amount: parsedAmount,
      date,
      kind: 'topup' as const,
      counterparty: null,
      note: note.trim() || null,
    }
    const optimistic: CashMovement = {
      id: crypto.randomUUID(),
      ...payload,
      created_by: userId,
      created_at: new Date().toISOString(),
    }
    mutateCashMovement({ kind: 'create', record: optimistic }, async () => {
      const { error: insertError } = await createCashMovement(supabase, {
        ...payload,
        created_by: userId,
      })
      return { error: insertError }
    })
  }

  function handleSubmit() {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('請輸入有效金額')
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    if (isExpense) {
      submitExpense(parsedAmount, supabase)
    } else {
      submitTopup(parsedAmount, supabase)
    }

    requestClose()
  }

  function handleDelete() {
    if (!transaction) return
    setSubmitting(true)
    const supabase = createClient()
    mutateTransaction({ kind: 'delete', id: transaction.id }, async () => {
      const { error: deleteError } = await deleteTransaction(supabase, transaction.id)
      return { error: deleteError }
    })
    requestClose()
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) requestClose() }}
      className="fixed inset-0 z-30 flex animate-[dmp-fade-in_0.2s_ease] items-end justify-center bg-[rgba(30,20,12,0.4)]"
    >
      <div
        ref={sheetRef}
        className="bg-background max-h-[92dvh] w-full max-w-[480px] animate-[dmp-slide-up_0.28s_cubic-bezier(0.3,0.7,0.3,1)] overflow-y-auto rounded-t-[28px] pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        {/* grabber + header：下滑手勢區（不涵蓋可捲動的表單本體，避免與捲動衝突） */}
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className="touch-none"
        >
        {/* grabber */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="bg-line-strong h-[5px] w-9 rounded-[3px]" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <button
            onClick={requestClose}
            className="text-muted cursor-pointer border-none bg-transparent py-1 text-[15px]"
          >
            取消
          </button>
          <span className="text-text text-base font-semibold">
            {isEdit ? '編輯記錄' : '新增記錄'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSave}
            className={`border-none bg-transparent py-1 text-[15px] font-semibold ${
              canSave && !submitting ? 'text-accent cursor-pointer' : 'text-muted cursor-default'
            }`}
          >
            {submitting ? '處理中' : '儲存'}
          </button>
        </div>
        </div>
        {/* /grabber + header drag region */}

        <div className="flex flex-col gap-3.5 px-5">
          {/* entry kind segmented（新增時才有；編輯只會是消費紀錄） */}
          {!isEdit && (
            <div className="bg-surface-alt flex gap-[3px] rounded-[14px] p-[3px]">
              {(['expense', 'topup'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEntryKind(t)}
                  className={`flex-1 cursor-pointer rounded-[11px] border-none py-2 text-sm font-semibold transition-all ${
                    entryKind === t
                      ? 'bg-surface text-text shadow-[0_1px_4px_rgba(30,20,12,0.10)]'
                      : 'text-muted bg-transparent'
                  }`}
                >
                  {t === 'expense' ? '支出' : '入帳'}
                </button>
              ))}
            </div>
          )}

          {/* amount */}
          <div className="bg-surface shadow-soft flex items-center gap-1.5 rounded-[18px] px-[18px] py-3.5">
            <span className="text-muted font-mono text-lg">NT$</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              className="text-text flex-1 border-none bg-transparent font-mono text-[28px] font-bold outline-none"
            />
          </div>

          {/* category chips (expense only) */}
          {isExpense && categories.length > 0 && (
            <div className="-mx-5 overflow-x-auto px-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
              <div className="flex gap-2 pb-1">
                {categories.map((c) => {
                  const selected = c.id === categoryId
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-[14px] border-none px-2.5 py-2 transition-all ${
                        selected ? 'bg-surface shadow-soft' : 'bg-surface-alt'
                      }`}
                    >
                      <CategoryAvatar emoji={c.emoji} color={c.color} size={36} />
                      <span
                        className={`text-[11px] whitespace-nowrap ${
                          selected ? 'text-text font-semibold' : 'text-muted font-normal'
                        }`}
                      >
                        {c.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* note */}
          <div className="bg-surface shadow-soft rounded-[14px] px-4 py-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              className="text-text w-full border-none bg-transparent text-sm outline-none"
            />
          </div>

          {/* payment method (expense only) */}
          {isExpense && (
            <div className="bg-surface-alt flex gap-[3px] rounded-[14px] p-[3px]">
              {methodOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPaymentMethod(option)}
                  className={`flex-1 cursor-pointer rounded-[11px] border-none py-2 text-[13px] font-semibold transition-all ${
                    paymentMethod === option
                      ? 'bg-accent-soft text-accent-text'
                      : 'text-muted bg-transparent'
                  }`}
                >
                  {paymentMethodOptionLabel(option, userId, profiles)}
                </button>
              ))}
            </div>
          )}

          {/* date */}
          <div className="bg-surface shadow-soft rounded-[14px] px-4 py-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-text w-full border-none bg-transparent text-sm outline-none"
            />
          </div>

          {error && <p className="m-0 text-xs text-[#B83B3B]">{error}</p>}

          {/* primary CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSave}
            className={`w-full rounded-[18px] border-none py-3.5 text-base font-bold transition-all ${
              canSave && !submitting
                ? 'bg-accent cursor-pointer text-white'
                : 'bg-surface-alt text-muted cursor-not-allowed'
            }`}
          >
            {submitting ? '處理中...' : isEdit ? '儲存變更' : '新增記錄'}
          </button>

          {/* delete (edit only) */}
          {isEdit && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="bg-surface-alt text-muted flex-1 cursor-pointer rounded-[14px] border-none py-3 text-sm font-semibold"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-[14px] border-none bg-[#B83B3B] py-3 text-sm font-semibold text-white"
                >
                  確認刪除
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
                className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-medium text-[#B83B3B]"
              >
                刪除這筆記錄
              </button>
            )
          )}

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

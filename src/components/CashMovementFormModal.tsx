'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLedgerMutators } from '@/components/TransactionsMutationContext'
import { cashMovementLabel } from '@/lib/cashMovement'
import { formatMoney } from '@/lib/money'
import { todayISO } from '@/lib/month'
import {
  createCashMovement,
  deleteCashMovement,
  updateCashMovement,
} from '@/lib/repos/cashMovements'
import type { CashMovement, CashMovementKind } from '@/types/database'

/**
 * 開啟現金移動表單的三種入口：
 * - 首頁點「共同卡未出帳」→ 記帳單扣款
 * - 首頁點某人的待還墊付 → 結算給該對象（金額預設帶入其待還總額，可改為部分金額）
 * - 明細點一筆現金移動 → 編輯
 */
export type CashMovementDraft =
  | { movementKind: 'card_bill' }
  | { movementKind: 'settlement'; counterparty: string; defaultAmount: number }
  | { movement: CashMovement }

interface CashMovementFormModalProps {
  userId: string
  draft: CashMovementDraft
  /** card_bill 差額提示用：目前累計未出帳（僅新增帳單扣款時提供） */
  currentUnbilled?: number
  profiles: Record<string, string>
  onClose: () => void
}

const TODAY = todayISO()

export default function CashMovementFormModal({
  userId,
  draft,
  currentUnbilled,
  profiles,
  onClose,
}: CashMovementFormModalProps) {
  const { mutateCashMovement } = useLedgerMutators()

  const isEdit = 'movement' in draft
  const existing = 'movement' in draft ? draft.movement : null
  const kind: CashMovementKind = 'movement' in draft ? draft.movement.kind : draft.movementKind
  const counterparty =
    'movement' in draft
      ? draft.movement.counterparty
      : draft.movementKind === 'settlement'
        ? draft.counterparty
        : null

  const [amount, setAmount] = useState(() => {
    if (existing) return String(existing.amount)
    if ('movementKind' in draft && draft.movementKind === 'settlement' && draft.defaultAmount > 0) {
      return String(draft.defaultAmount)
    }
    return ''
  })
  const [date, setDate] = useState(existing?.date ?? TODAY)
  const [note, setNote] = useState(existing?.note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const parsedAmount = parseFloat(amount)
  const canSave = !!amount && parsedAmount > 0

  const title = cashMovementLabel({ kind, counterparty }, profiles)

  // 帳單金額與 app 累計未出帳不符時提示差額（可能有消費未記錄）；相符則不顯示。
  const unbilledDiff =
    !isEdit && kind === 'card_bill' && currentUnbilled !== undefined && canSave
      ? parsedAmount - currentUnbilled
      : 0

  function handleSubmit() {
    if (!canSave) {
      setError('請輸入有效金額')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const payload = { amount: parsedAmount, date, kind, counterparty, note: note.trim() || null }

    if (existing) {
      const optimistic: CashMovement = { ...existing, ...payload }
      mutateCashMovement({ kind: 'update', record: optimistic }, async () => {
        const { error: updateError } = await updateCashMovement(supabase, existing.id, payload)
        return { error: updateError }
      })
    } else {
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

    onClose()
  }

  function handleDelete() {
    if (!existing) return
    setSubmitting(true)
    const supabase = createClient()
    mutateCashMovement({ kind: 'delete', id: existing.id }, async () => {
      const { error: deleteError } = await deleteCashMovement(supabase, existing.id)
      return { error: deleteError }
    })
    onClose()
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-30 flex animate-[dmp-fade-in_0.2s_ease] items-end justify-center bg-[rgba(30,20,12,0.4)]"
    >
      <div className="bg-background w-full max-w-[480px] animate-[dmp-slide-up_0.28s_cubic-bezier(0.3,0.7,0.3,1)] rounded-t-[28px] pb-[max(24px,env(safe-area-inset-bottom))]">
        {/* grabber */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="bg-line-strong h-[5px] w-9 rounded-[3px]" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <button
            onClick={onClose}
            className="text-muted cursor-pointer border-none bg-transparent py-1 text-[15px]"
          >
            取消
          </button>
          <span className="text-text text-base font-semibold">{title}</span>
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

        <div className="flex flex-col gap-3.5 px-5">
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

          {unbilledDiff !== 0 && (
            <p className="text-accent m-0 text-xs">
              與 app 累計未出帳（{formatMoney(currentUnbilled ?? 0)}）相差{' '}
              {formatMoney(Math.abs(unbilledDiff))}，可能有消費未記錄
            </p>
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

          {error && <p className="m-0 text-xs text-[#B83B3B]">{error}</p>}

          {/* primary CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSave}
            className={`w-full rounded-[18px] border-none py-3.5 text-base font-bold ${
              canSave && !submitting
                ? 'bg-accent cursor-pointer text-white'
                : 'bg-surface-alt text-muted cursor-not-allowed'
            }`}
          >
            {submitting ? '處理中...' : isEdit ? '儲存變更' : '新增記錄'}
          </button>

          {/* delete (edit only) */}
          {isEdit &&
            (confirmDelete ? (
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
            ))}

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

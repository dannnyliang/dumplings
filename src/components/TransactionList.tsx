'use client'

import { useState } from 'react'
import TransactionFormModal from './TransactionFormModal'
import CashMovementFormModal from './CashMovementFormModal'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import { cashMovementDirection, cashMovementLabel } from '@/lib/cashMovement'
import { formatSignedMoney } from '@/lib/money'
import { formatDayLabel } from '@/lib/month'
import { isPaidByJointCard, isUserAdvance, paymentMethodLabel } from '@/lib/paymentMethod'
import type { CashMovement, CashMovementKind, Category, Transaction } from '@/types/database'

/** 首頁明細的一列：消費紀錄或現金移動。 */
export type LedgerItem =
  | { kind: 'transaction'; record: Transaction }
  | { kind: 'movement'; record: CashMovement }

interface TransactionListProps {
  items: LedgerItem[]
  userId: string
  profiles: Record<string, string>
  categories?: Category[]
}

const MOVEMENT_EMOJI: Record<CashMovementKind, string> = {
  topup: '💵',
  card_bill: '💳',
  settlement: '🤝',
}

function TransactionRow({
  transaction,
  profiles,
  onEdit,
}: {
  transaction: Transaction
  profiles: Record<string, string>
  onEdit: () => void
}) {
  const advance = isUserAdvance(transaction.payment_method)
  const methodTag = advance
    ? `${paymentMethodLabel(transaction.payment_method, profiles)} 墊付`
    : isPaidByJointCard(transaction.payment_method)
      ? paymentMethodLabel(transaction.payment_method, profiles)
      : null

  return (
    <li
      onClick={onEdit}
      className="border-line flex cursor-pointer items-center justify-between px-4 py-3 first:border-t-0 [&:not(:first-child)]:border-t"
    >
      <div className="flex items-center gap-3">
        <CategoryAvatar
          emoji={transaction.category?.emoji ?? null}
          color={transaction.category?.color ?? null}
          size={40}
        />
        <div>
          <p className="text-text m-0 text-sm font-medium">
            {transaction.category?.name ?? '支出'}
          </p>
          {transaction.note && <p className="text-muted mt-0.5 mb-0 text-xs">{transaction.note}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-expense m-0 font-mono text-sm font-semibold">
          {formatSignedMoney(transaction.amount, 'out')}
        </p>
        {methodTag && <p className="text-accent mt-0.5 mb-0 text-[11px]">{methodTag}</p>}
      </div>
    </li>
  )
}

function MovementRow({
  movement,
  profiles,
  onEdit,
}: {
  movement: CashMovement
  profiles: Record<string, string>
  onEdit: () => void
}) {
  const direction = cashMovementDirection(movement.kind)
  return (
    <li
      onClick={onEdit}
      className="border-line flex cursor-pointer items-center justify-between px-4 py-3 first:border-t-0 [&:not(:first-child)]:border-t"
    >
      <div className="flex items-center gap-3">
        <CategoryAvatar emoji={MOVEMENT_EMOJI[movement.kind]} color={null} size={40} />
        <div>
          <p className="text-text m-0 text-sm font-medium">
            {cashMovementLabel(movement, profiles)}
          </p>
          {movement.note && <p className="text-muted mt-0.5 mb-0 text-xs">{movement.note}</p>}
        </div>
      </div>
      <p
        className={`m-0 font-mono text-sm font-semibold ${
          direction === 'in' ? 'text-income' : 'text-expense'
        }`}
      >
        {formatSignedMoney(movement.amount, direction)}
      </p>
    </li>
  )
}

export default function TransactionList({
  items,
  userId,
  profiles,
  categories,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null)

  if (items.length === 0) {
    return (
      <div className="bg-surface shadow-soft rounded-3xl px-4 py-8 text-center">
        <p className="mb-2 text-4xl">🥟</p>
        <p className="text-muted text-[13px]">還沒有記錄，開始記帳吧！</p>
      </div>
    )
  }

  const grouped = items.reduce<Record<string, LedgerItem[]>>((acc, item) => {
    const key = item.record.date
    return { ...acc, [key]: [...(acc[key] ?? []), item] }
  }, {})

  return (
    <>
      <div className="flex flex-col gap-4">
        {Object.entries(grouped).map(([date, dayItems]) => (
          <div key={date} className="bg-surface shadow-soft overflow-hidden rounded-3xl">
            <div className="bg-surface-alt border-line border-b px-4 py-2">
              <span className="text-muted font-mono text-[11px] font-semibold tracking-[0.5px] uppercase">
                {formatDayLabel(date)}
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {dayItems.map((item) =>
                item.kind === 'transaction' ? (
                  <TransactionRow
                    key={item.record.id}
                    transaction={item.record}
                    profiles={profiles}
                    onEdit={() => setEditingTransaction(item.record)}
                  />
                ) : (
                  <MovementRow
                    key={item.record.id}
                    movement={item.record}
                    profiles={profiles}
                    onEdit={() => setEditingMovement(item.record)}
                  />
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      {editingTransaction && (
        <TransactionFormModal
          userId={userId}
          transaction={editingTransaction}
          categories={categories}
          profiles={profiles}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {editingMovement && (
        <CashMovementFormModal
          userId={userId}
          draft={{ movement: editingMovement }}
          profiles={profiles}
          onClose={() => setEditingMovement(null)}
        />
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TransactionFormModal from './TransactionFormModal'
import { useMutateTransactions } from './TransactionsMutationContext'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import { isAdvance } from '@/lib/balance'
import { formatSignedMoney } from '@/lib/money'
import { formatDayLabel } from '@/lib/month'
import { payerLabel } from '@/lib/paidBy'
import { setTransactionReimbursed } from '@/lib/repos/transactions'
import type { Transaction } from '@/types/database'

interface TransactionListProps {
  transactions: Transaction[]
  userId: string
  profiles: Record<string, string>
}

export default function TransactionList({ transactions, userId, profiles }: TransactionListProps) {
  const mutate = useMutateTransactions()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  function markReimbursed(transaction: Transaction) {
    const supabase = createClient()
    mutate({ kind: 'reimburse', id: transaction.id, isReimbursed: true }, async () => {
      const { error } = await setTransactionReimbursed(supabase, transaction.id, true)
      return { error }
    })
  }

  if (transactions.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 24, padding: '32px 16px', textAlign: 'center', boxShadow: 'var(--dmp-shadow-soft)' }}>
        <p style={{ fontSize: 36, marginBottom: 8 }}>🥟</p>
        <p style={{ fontSize: 13, color: 'var(--dmp-text-muted)' }}>還沒有記錄，開始記帳吧！</p>
      </div>
    )
  }

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = t.date
    return { ...acc, [key]: [...(acc[key] ?? []), t] }
  }, {})

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--dmp-surface-alt)', borderBottom: '1px solid var(--dmp-border)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dmp-text-muted)', fontFamily: '"SF Mono", ui-monospace, monospace', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {formatDayLabel(date)}
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((t, idx) => {
                const advance = isAdvance(t)
                const payerName = advance ? payerLabel(t.paid_by, profiles) : ''

                return (
                  <li
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderTop: idx > 0 ? '1px solid var(--dmp-border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CategoryAvatar
                        emoji={t.type === 'topup' ? '💵' : (t.category?.emoji ?? null)}
                        color={t.type === 'topup' ? null : (t.category?.color ?? null)}
                        size={40}
                      />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--dmp-text)', margin: 0 }}>
                          {t.category?.name ?? (t.type === 'topup' ? '入帳' : '支出')}
                        </p>
                        {t.note && (
                          <p style={{ fontSize: 12, color: 'var(--dmp-text-muted)', margin: '2px 0 0' }}>{t.note}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: t.type === 'topup' ? 'var(--dmp-income)' : 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
                        {formatSignedMoney(t.amount, t.type)}
                      </p>
                      {advance && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                          {t.is_reimbursed ? (
                            <span style={{ fontSize: 11, color: 'var(--dmp-text-muted)' }}>✓ {payerName} 已還清</span>
                          ) : (
                            <>
                              <span style={{ fontSize: 11, color: 'var(--dmp-accent)' }}>{payerName} 墊付</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); markReimbursed(t) }}
                                style={{ fontSize: 11, color: 'var(--dmp-accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                還清
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {editingTransaction && (
        <TransactionFormModal
          userId={userId}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </>
  )
}

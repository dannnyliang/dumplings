'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import BalanceSummary from './BalanceSummary'
import SparkBarChart from './SparkBarChart'
import TransactionList from './TransactionList'
import AddTransactionButton from './AddTransactionButton'
import { TransactionsMutationContext, type MutateTransactions } from './TransactionsMutationContext'
import { applyTransactionMutation, type TransactionMutation } from '@/lib/transactionsOptimistic'
import { showToast } from '@/lib/toast'
import { tryHaptic } from '@/lib/haptics'
import type { Category, Transaction } from '@/types/database'

interface TransactionsBoardProps {
  initialTransactions: Transaction[]
  userId: string
  profiles: Record<string, string>
  categories: Category[]
}

function successMessage(mutation: TransactionMutation): string {
  switch (mutation.kind) {
    case 'create':
      return '已新增記錄'
    case 'update':
      return '已更新記錄'
    case 'delete':
      return '已刪除記錄'
    case 'reimburse':
      return mutation.isReimbursed ? '已標記為還清' : '已還原為未還清'
  }
}

/**
 * 首頁明細的樂觀更新容器：以 useOptimistic 持有 transactions，
 * 讓餘額（BalanceSummary）、圖表（SparkBarChart）、明細（TransactionList）吃同一份即時資料。
 * 子元件透過 context 拿到 mutate，送出後畫面立即反映，Supabase 成功再 router.refresh() 對齊，
 * 失敗則因 transition 結束、optimistic 捨棄而自動 rollback。
 */
export default function TransactionsBoard({
  initialTransactions,
  userId,
  profiles,
  categories,
}: TransactionsBoardProps) {
  const router = useRouter()
  const [transactions, applyOptimistic] = useOptimistic(
    initialTransactions,
    applyTransactionMutation
  )
  const [, startTransition] = useTransition()

  const mutate: MutateTransactions = (optimistic, commit) => {
    tryHaptic()
    startTransition(async () => {
      applyOptimistic(optimistic)
      const { error } = await commit()
      if (error) {
        showToast('操作失敗，已還原', 'error')
        return
      }
      showToast(successMessage(optimistic))
      router.refresh()
    })
  }

  return (
    <TransactionsMutationContext.Provider value={mutate}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BalanceSummary transactions={transactions} profiles={profiles} />

        <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 24, padding: '16px 20px', boxShadow: 'var(--dmp-shadow-soft)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dmp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            近 14 天支出
          </p>
          <SparkBarChart transactions={transactions} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--dmp-text)' }}>最近交易</span>
          </div>
          <TransactionList transactions={transactions} userId={userId} profiles={profiles} categories={categories} />
        </div>
      </div>

      <AddTransactionButton userId={userId} categories={categories} />
    </TransactionsMutationContext.Provider>
  )
}

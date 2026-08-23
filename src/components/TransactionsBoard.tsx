'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import BalanceSummary from './BalanceSummary'
import SparkBarChart from './SparkBarChart'
import TransactionList, { type LedgerItem } from './TransactionList'
import AddTransactionButton from './AddTransactionButton'
import CashMovementFormModal, { type CashMovementDraft } from './CashMovementFormModal'
import {
  TransactionsMutationContext,
  type CommitResult,
  type LedgerMutators,
} from './TransactionsMutationContext'
import { computeBalance } from '@/lib/balance'
import { sortCategoriesByUsage } from '@/lib/categoryUsage'
import { currentMonth } from '@/lib/month'
import { computeMonthTotals } from '@/lib/report'
import { applyLedgerMutation, compareLedgerDesc } from '@/lib/transactionsOptimistic'
import { showToast } from '@/lib/toast'
import { tryHaptic } from '@/lib/haptics'
import type { CashMovement, Category, Transaction } from '@/types/database'

interface TransactionsBoardProps {
  initialTransactions: Transaction[]
  initialCashMovements: CashMovement[]
  userId: string
  profiles: Record<string, string>
  categories: Category[]
}

/** 明細只顯示最近這麼多筆；餘額一律以全部紀錄計算，與此上限無關。 */
const DISPLAY_LIMIT = 100

function successMessage(kind: 'create' | 'update' | 'delete'): string {
  switch (kind) {
    case 'create':
      return '已新增記錄'
    case 'update':
      return '已更新記錄'
    case 'delete':
      return '已刪除記錄'
  }
}

/**
 * 首頁的樂觀更新容器：以 useOptimistic 分別持有消費紀錄與現金移動，
 * 讓餘額（BalanceSummary）、圖表（SparkBarChart）、明細（TransactionList）吃同一份即時資料。
 * 子元件透過 context 拿到 mutate，送出後畫面立即反映，Supabase 成功再 router.refresh() 對齊，
 * 失敗則因 transition 結束、optimistic 捨棄而自動 rollback。
 */
export default function TransactionsBoard({
  initialTransactions,
  initialCashMovements,
  userId,
  profiles,
  categories,
}: TransactionsBoardProps) {
  const router = useRouter()
  const [transactions, applyTransactionOptimistic] = useOptimistic(
    initialTransactions,
    applyLedgerMutation<Transaction>
  )
  const [cashMovements, applyCashMovementOptimistic] = useOptimistic(
    initialCashMovements,
    applyLedgerMutation<CashMovement>
  )
  const [, startTransition] = useTransition()
  const [movementDraft, setMovementDraft] = useState<CashMovementDraft | null>(null)

  function runMutation(
    applyOptimistic: () => void,
    commit: () => Promise<CommitResult>,
    kind: 'create' | 'update' | 'delete'
  ) {
    tryHaptic()
    startTransition(async () => {
      applyOptimistic()
      const { error } = await commit()
      if (error) {
        showToast('操作失敗，已還原', 'error')
        return
      }
      showToast(successMessage(kind))
      router.refresh()
    })
  }

  const mutators: LedgerMutators = {
    mutateTransaction: (optimistic, commit) =>
      runMutation(() => applyTransactionOptimistic(optimistic), commit, optimistic.kind),
    mutateCashMovement: (optimistic, commit) =>
      runMutation(() => applyCashMovementOptimistic(optimistic), commit, optimistic.kind),
  }

  const breakdown = computeBalance(transactions, cashMovements)
  const monthTotals = computeMonthTotals(transactions, cashMovements, currentMonth())

  // 記帳表單的分類 chip 依使用頻率排序，常用的少捲一段；吃樂觀更新後的紀錄，剛記完立即反映。
  const categoriesByUsage = sortCategoriesByUsage(categories, transactions)

  const items: LedgerItem[] = [
    ...transactions.map((t) => ({ kind: 'transaction' as const, record: t })),
    ...cashMovements.map((m) => ({ kind: 'movement' as const, record: m })),
  ]
    .sort((a, b) => compareLedgerDesc(a.record, b.record))
    .slice(0, DISPLAY_LIMIT)

  return (
    <TransactionsMutationContext.Provider value={mutators}>
      <div className="mx-auto flex max-w-[480px] flex-col gap-5 px-5 py-4">
        <BalanceSummary
          breakdown={breakdown}
          monthTotals={monthTotals}
          profiles={profiles}
          onRecordCardBill={() => setMovementDraft({ movementKind: 'card_bill' })}
          onSettle={(counterparty, outstanding) =>
            setMovementDraft({ movementKind: 'settlement', counterparty, defaultAmount: outstanding })
          }
        />

        <div className="bg-surface shadow-soft rounded-3xl px-5 py-4">
          <p className="text-muted mb-3 text-[11px] font-semibold tracking-[0.8px] uppercase">
            近 14 天支出
          </p>
          <SparkBarChart transactions={transactions} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-text text-[15px] font-semibold">最近交易</span>
          </div>
          <TransactionList
            items={items}
            userId={userId}
            profiles={profiles}
            categories={categoriesByUsage}
          />
        </div>
      </div>

      <AddTransactionButton userId={userId} categories={categoriesByUsage} />

      {movementDraft && (
        <CashMovementFormModal
          userId={userId}
          draft={movementDraft}
          currentUnbilled={breakdown.cardUnbilled}
          profiles={profiles}
          onClose={() => setMovementDraft(null)}
        />
      )}
    </TransactionsMutationContext.Provider>
  )
}

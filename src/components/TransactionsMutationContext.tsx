'use client'

import { createContext, useContext } from 'react'
import type { LedgerMutation } from '@/lib/transactionsOptimistic'
import type { CashMovement, Transaction } from '@/types/database'

/** commit 回傳需帶 error（Supabase mutation 回應天然符合此形狀）。 */
export interface CommitResult {
  error: unknown
}

/**
 * 樂觀 mutation 的統一入口：
 * - optimistic：立刻套用到 UI 的意圖
 * - commit：實際打 Supabase 的動作，成功回 { error: null }
 * board 負責串起「先樂觀套用 → 送出 → 成功則 refresh、失敗則自動 rollback」。
 * 消費紀錄與現金移動各有一條 mutate 路徑，共用同一套流程。
 */
export interface LedgerMutators {
  mutateTransaction: (
    optimistic: LedgerMutation<Transaction>,
    commit: () => Promise<CommitResult>
  ) => void
  mutateCashMovement: (
    optimistic: LedgerMutation<CashMovement>,
    commit: () => Promise<CommitResult>
  ) => void
}

export const TransactionsMutationContext = createContext<LedgerMutators | null>(null)

export function useLedgerMutators(): LedgerMutators {
  const mutators = useContext(TransactionsMutationContext)
  if (!mutators) {
    throw new Error('useLedgerMutators 必須在 TransactionsBoard 內使用')
  }
  return mutators
}

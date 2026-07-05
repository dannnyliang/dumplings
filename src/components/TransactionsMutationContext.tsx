'use client'

import { createContext, useContext } from 'react'
import type { TransactionMutation } from '@/lib/transactionsOptimistic'

/** commit 回傳需帶 error（Supabase mutation 回應天然符合此形狀）。 */
export interface CommitResult {
  error: unknown
}

/**
 * 樂觀 mutation 的統一入口：
 * - optimistic：立刻套用到 UI 的意圖
 * - commit：實際打 Supabase 的動作，成功回 { error: null }
 * board 負責串起「先樂觀套用 → 送出 → 成功則 refresh、失敗則自動 rollback」。
 */
export type MutateTransactions = (
  optimistic: TransactionMutation,
  commit: () => Promise<CommitResult>
) => void

export const TransactionsMutationContext = createContext<MutateTransactions | null>(null)

export function useMutateTransactions(): MutateTransactions {
  const mutate = useContext(TransactionsMutationContext)
  if (!mutate) {
    throw new Error('useMutateTransactions 必須在 TransactionsBoard 內使用')
  }
  return mutate
}

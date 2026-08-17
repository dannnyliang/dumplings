import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionList, { type LedgerItem } from '@/components/TransactionList'
import type { CashMovement, Transaction } from '@/types/database'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  }),
}))

vi.mock('@/components/TransactionsMutationContext', () => ({
  useLedgerMutators: () => ({
    mutateTransaction: (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
    mutateCashMovement: (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
  }),
}))

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 500,
    category_id: null,
    date: '2026-04-01',
    note: null,
    payment_method: 'shared',
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function makeMovement(overrides: Partial<CashMovement>): CashMovement {
  return {
    id: 'm1',
    amount: 3000,
    date: '2026-04-01',
    kind: 'topup',
    counterparty: null,
    note: null,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function txnItem(overrides: Partial<Transaction>): LedgerItem {
  return { kind: 'transaction', record: makeTxn(overrides) }
}

function movementItem(overrides: Partial<CashMovement>): LedgerItem {
  return { kind: 'movement', record: makeMovement(overrides) }
}

function renderList(items: LedgerItem[]) {
  return render(<TransactionList items={items} userId="uid-danny" profiles={PROFILES} />)
}

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('空狀態', () => {
    it('無記錄時顯示空提示', () => {
      renderList([])
      expect(screen.getByText(/開始記帳吧/)).toBeInTheDocument()
    })
  })

  describe('消費紀錄列', () => {
    it('支出顯示 - 前綴', () => {
      renderList([txnItem({ amount: 500 })])
      expect(screen.getByText(/-NT\$/)).toBeInTheDocument()
    })

    it('顯示備註', () => {
      renderList([txnItem({ note: '晚餐' })])
      expect(screen.getByText('晚餐')).toBeInTheDocument()
    })

    it('顯示分類名稱', () => {
      renderList([
        txnItem({
          category: { id: 'cat-1', name: '餐飲', emoji: null, color: null, is_active: true, created_by: null, created_at: '' },
        }),
      ])
      expect(screen.getByText('餐飲')).toBeInTheDocument()
    })

    it('同一天的記錄顯示在同一組', () => {
      renderList([txnItem({ id: 't1', amount: 100 }), txnItem({ id: 't2', amount: 200 })])
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/200/)).toBeInTheDocument()
    })
  })

  describe('付款方式標籤', () => {
    it('墊付的消費顯示付款人名稱', () => {
      renderList([txnItem({ payment_method: 'uid-peiyu' })])
      expect(screen.getByText('PeiYu 墊付')).toBeInTheDocument()
    })

    it('共同卡消費顯示共同卡標籤，與墊付可區分', () => {
      renderList([txnItem({ payment_method: 'joint_card' })])
      expect(screen.getByText('共同卡')).toBeInTheDocument()
      expect(screen.queryByText(/墊付/)).not.toBeInTheDocument()
    })

    it('共同帳戶支出不顯示付款方式標籤', () => {
      renderList([txnItem({ payment_method: 'shared' })])
      expect(screen.queryByText(/墊付/)).not.toBeInTheDocument()
      expect(screen.queryByText('共同卡')).not.toBeInTheDocument()
    })
  })

  describe('現金移動列', () => {
    it('入帳顯示 + 前綴與名稱', () => {
      renderList([movementItem({ kind: 'topup', amount: 3000 })])
      expect(screen.getByText('入帳')).toBeInTheDocument()
      expect(screen.getByText(/\+NT\$/)).toBeInTheDocument()
    })

    it('帳單扣款顯示 - 前綴與名稱', () => {
      renderList([movementItem({ kind: 'card_bill', amount: 3000 })])
      expect(screen.getByText('共同卡帳單扣款')).toBeInTheDocument()
      expect(screen.getByText(/-NT\$/)).toBeInTheDocument()
    })

    it('結算顯示對象名稱', () => {
      renderList([movementItem({ kind: 'settlement', counterparty: 'uid-peiyu' })])
      expect(screen.getByText('結算給 PeiYu')).toBeInTheDocument()
    })
  })

  describe('點擊行為', () => {
    it('點擊消費紀錄後開啟編輯 modal', async () => {
      const user = userEvent.setup()
      renderList([txnItem({ amount: 999 })])
      const li = screen.getByText(/-NT\$/).closest('li')!
      await user.click(li)
      expect(screen.getByText('編輯記錄')).toBeInTheDocument()
    })

    it('點擊現金移動後開啟現金移動編輯 modal', async () => {
      const user = userEvent.setup()
      renderList([movementItem({ kind: 'topup', amount: 3000 })])
      const li = screen.getByText(/\+NT\$/).closest('li')!
      await user.click(li)
      expect(screen.getByText('刪除這筆記錄')).toBeInTheDocument()
    })
  })
})

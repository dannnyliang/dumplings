import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionList from '@/components/TransactionList'
import type { Transaction } from '@/types/database'

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
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'uid-danny' } } })) },
  }),
}))

vi.mock('@/components/TransactionsMutationContext', () => ({
  useMutateTransactions:
    () => (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
}))

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 500,
    type: 'expense',
    category_id: null,
    date: '2026-04-01',
    note: null,
    paid_by: 'shared',
    is_reimbursed: false,
    reimbursed_at: null,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('空狀態', () => {
    it('無交易時顯示空提示', () => {
      render(<TransactionList transactions={[]} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/開始記帳吧/)).toBeInTheDocument()
    })
  })

  describe('交易列表', () => {
    it('顯示入帳記錄金額', () => {
      const txns = [makeTxn({ type: 'topup', amount: 3000, paid_by: 'shared' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/3,000/)).toBeInTheDocument()
    })

    it('入帳顯示 + 前綴', () => {
      const txns = [makeTxn({ type: 'topup', amount: 1000, paid_by: 'shared' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/\+NT\$/)).toBeInTheDocument()
    })

    it('支出顯示 - 前綴', () => {
      const txns = [makeTxn({ type: 'expense', amount: 500, paid_by: 'shared' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/-NT\$/)).toBeInTheDocument()
    })

    it('顯示備註', () => {
      const txns = [makeTxn({ note: '晚餐' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText('晚餐')).toBeInTheDocument()
    })

    it('同一天的交易顯示在同一組', () => {
      const txns = [
        makeTxn({ id: 't1', amount: 100 }),
        makeTxn({ id: 't2', amount: 200 }),
      ]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/200/)).toBeInTheDocument()
    })

    it('顯示分類名稱', () => {
      const txns = [makeTxn({ category: { id: 'cat-1', name: '餐飲', emoji: null, color: null, is_active: true, created_by: null, created_at: '' } })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText('餐飲')).toBeInTheDocument()
    })
  })

  describe('墊付顯示', () => {
    it('未還清的墊付顯示付款人名稱', () => {
      const txns = [makeTxn({ paid_by: 'uid-danny', is_reimbursed: false })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/Danny 墊付/)).toBeInTheDocument()
    })

    it('未還清的墊付顯示「還清」按鈕', () => {
      const txns = [makeTxn({ paid_by: 'uid-danny', is_reimbursed: false })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByRole('button', { name: '還清' })).toBeInTheDocument()
    })

    it('已還清的墊付顯示「已還清」', () => {
      const txns = [makeTxn({
        paid_by: 'uid-danny',
        is_reimbursed: true,
        reimbursed_at: '2026-04-02T00:00:00Z',
      })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/已還清/)).toBeInTheDocument()
    })

    it('shared 支出不顯示墊付資訊', () => {
      const txns = [makeTxn({ paid_by: 'shared' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.queryByText(/墊付/)).not.toBeInTheDocument()
    })

    it('入帳不顯示墊付資訊', () => {
      const txns = [makeTxn({ type: 'topup', paid_by: 'shared' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.queryByText(/墊付/)).not.toBeInTheDocument()
    })

    it('信用卡代墊顯示「信用卡」標籤', () => {
      const txns = [makeTxn({ paid_by: 'credit_card', is_reimbursed: false })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/信用卡 墊付/)).toBeInTheDocument()
    })

    it('信用卡已還清顯示「信用卡 已還清」', () => {
      const txns = [makeTxn({ paid_by: 'credit_card', is_reimbursed: true, reimbursed_at: '2026-04-02T00:00:00Z' })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      expect(screen.getByText(/信用卡 已還清/)).toBeInTheDocument()
    })
  })

  describe('點擊行為', () => {
    it('點擊交易記錄後開啟編輯 modal', async () => {
      const user = userEvent.setup()
      const txns = [makeTxn({ amount: 999 })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      const li = screen.getByText(/-NT\$/).closest('li')!
      await user.click(li)
      expect(screen.getByText('編輯記錄')).toBeInTheDocument()
    })

    it('點擊「還清」不會開啟 modal（stopPropagation）', async () => {
      const user = userEvent.setup()
      const txns = [makeTxn({ paid_by: 'uid-danny', is_reimbursed: false })]
      render(<TransactionList transactions={txns} userId="uid-danny" profiles={PROFILES} />)
      await user.click(screen.getByRole('button', { name: '還清' }))
      expect(screen.queryByText('編輯記錄')).not.toBeInTheDocument()
    })
  })
})

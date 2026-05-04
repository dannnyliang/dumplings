import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionFormModal from '@/components/TransactionFormModal'
import type { Transaction } from '@/types/database'

const mockRefresh = vi.fn()
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() =>
          Promise.resolve({ data: [{ id: 'cat-1', name: '餐飲', is_active: true }], error: null })
        ),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'uid-danny' } } })),
  },
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

const BASE_TRANSACTION: Transaction = {
  id: 't1',
  amount: 500,
  type: 'expense',
  category_id: 'cat-1',
  date: '2026-04-01',
  note: '午餐',
  paid_by: 'uid-danny',
  is_reimbursed: false,
  reimbursed_at: null,
  created_by: 'uid-danny',
  created_at: '2026-04-01T00:00:00Z',
}

describe('TransactionFormModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('新增模式', () => {
    it('顯示「新增記錄」標題', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.getAllByText('新增記錄').length).toBeGreaterThanOrEqual(1)
    })

    it('預設顯示支出與入帳兩個切換按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.getByRole('button', { name: '支出' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '入帳' })).toBeInTheDocument()
    })

    it('不顯示刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.queryByText('刪除這筆記錄')).not.toBeInTheDocument()
    })

    it('切換到入帳後付款方式選項消失', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '入帳' }))
      expect(screen.queryByText('共同帳戶')).not.toBeInTheDocument()
    })

    it('點擊取消按鈕呼叫 onClose', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('編輯模式', () => {
    it('顯示「編輯記錄」標題', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getAllByText('編輯記錄').length).toBeGreaterThanOrEqual(1)
    })

    it('創建者可見刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getByText('刪除這筆記錄')).toBeInTheDocument()
    })

    it('非創建者也顯示刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-peiyu" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getByText('刪除這筆記錄')).toBeInTheDocument()
    })

    it('預填金額欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const amountInput = screen.getByPlaceholderText('0') as HTMLInputElement
      expect(amountInput.value).toBe('500')
    })

    it('預填備註欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const noteInput = screen.getByPlaceholderText('備註（選填）') as HTMLInputElement
      expect(noteInput.value).toBe('午餐')
    })

    it('預填日期欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const dateInput = screen.getByDisplayValue('2026-04-01') as HTMLInputElement
      expect(dateInput.value).toBe('2026-04-01')
    })
  })

  describe('表單驗證', () => {
    it('金額為空時 CTA 按鈕為 disabled', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')
      expect(ctaBtn).toBeDisabled()
    })
  })

  describe('新增模式送出', () => {
    it('填入有效金額送出後呼叫 onClose', async () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '300' } })
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    })
  })

  describe('編輯模式送出', () => {
    it('有預填金額時點擊儲存呼叫 onClose', async () => {
      render(
        <TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />
      )
      fireEvent.click(screen.getAllByText('儲存變更')[0])
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    })
  })

  describe('刪除操作', () => {
    it('點擊刪除後顯示確認按鈕', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      await user.click(screen.getByText('刪除這筆記錄'))
      expect(screen.getByText('確認刪除')).toBeInTheDocument()
    })

    it('確認刪除後呼叫 onClose', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      await user.click(screen.getByText('刪除這筆記錄'))
      await user.click(screen.getByText('確認刪除'))
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    })

    it('取消刪除不呼叫 onClose', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      await user.click(screen.getByText('刪除這筆記錄'))
      // The cancel button in the confirm row is the last "取消" on screen
      const cancelBtns = screen.getAllByText('取消')
      await user.click(cancelBtns[cancelBtns.length - 1])
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})

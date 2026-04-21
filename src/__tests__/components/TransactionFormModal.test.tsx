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
      expect(screen.getByText('新增記錄')).toBeInTheDocument()
    })

    it('預設選擇「支出」類型', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      const expenseBtn = screen.getByRole('button', { name: '支出' })
      expect(expenseBtn.className).toContain('bg-indigo-500')
    })

    it('顯示「新增」送出按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument()
    })

    it('不顯示刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.queryByText('刪除這筆記錄')).not.toBeInTheDocument()
    })

    it('切換到入帳後入帳按鈕為 active', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '入帳' }))
      expect(screen.getByRole('button', { name: '入帳' }).className).toContain('bg-indigo-500')
    })

    it('點擊 × 按鈕呼叫 onClose', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '×' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('編輯模式', () => {
    it('顯示「編輯記錄」標題', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getByText('編輯記錄')).toBeInTheDocument()
    })

    it('顯示「儲存」送出按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument()
    })

    it('創建者可見刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getByText('刪除這筆記錄')).toBeInTheDocument()
    })

    it('非創建者不顯示刪除按鈕', () => {
      render(<TransactionFormModal userId="uid-peiyu" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.queryByText('刪除這筆記錄')).not.toBeInTheDocument()
    })

    it('預填金額欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const amountInput = screen.getByPlaceholderText('0') as HTMLInputElement
      expect(amountInput.value).toBe('500')
    })

    it('預填備註欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const noteInput = screen.getByPlaceholderText('備註...') as HTMLInputElement
      expect(noteInput.value).toBe('午餐')
    })

    it('預填日期欄位', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      const dateInput = screen.getByDisplayValue('2026-04-01') as HTMLInputElement
      expect(dateInput.value).toBe('2026-04-01')
    })
  })

  describe('表單驗證', () => {
    it('金額為空送出時顯示錯誤', async () => {
      const { container } = render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      // Use fireEvent.submit to bypass jsdom HTML5 constraint validation
      // (required attribute blocks userEvent.click on submit in jsdom)
      fireEvent.submit(container.querySelector('form')!)
      expect(await screen.findByText('請輸入有效金額')).toBeInTheDocument()
    })
  })
})

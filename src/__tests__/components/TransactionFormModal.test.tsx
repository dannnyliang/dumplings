import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionFormModal from '@/components/TransactionFormModal'
import type { Transaction } from '@/types/database'

const mockRefresh = vi.fn()
const mockInsert = vi.fn(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}))
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      order: vi.fn(() =>
        Promise.resolve({
          data: [{ id: 'cat-1', name: '餐飲', emoji: '🍜', color: '#FFE3D5', is_active: true }],
          error: null,
        })
      ),
    })),
  })),
  insert: mockInsert,
  update: mockUpdate,
  delete: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })),
}))
const mockSupabase = { from: mockFrom }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
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

const BASE_TRANSACTION: Transaction = {
  id: 't1',
  amount: 500,
  category_id: 'cat-1',
  date: '2026-04-01',
  note: '午餐',
  payment_method: 'uid-danny',
  created_by: 'uid-danny',
  created_at: '2026-04-01T00:00:00Z',
}

describe('TransactionFormModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
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

    it('付款方式只有共同帳戶、共同卡、我墊的三個選項', () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(screen.getByRole('button', { name: '共同帳戶' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '共同卡' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '我墊的' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /PeiYu 墊的/ })).not.toBeInTheDocument()
    })

    it('切換到入帳後付款方式選項消失', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '入帳' }))
      expect(screen.queryByText('共同帳戶')).not.toBeInTheDocument()
      expect(screen.queryByText('共同卡')).not.toBeInTheDocument()
    })

    it('分類 chip 顯示 emoji', async () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      expect(await screen.findByText('🍜')).toBeInTheDocument()
    })

    it('點擊取消按鈕呼叫 onClose', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '取消' }))
      // 關閉會先播退場動畫再卸載，onClose 為延遲呼叫
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    })
  })

  describe('編輯模式', () => {
    it('顯示「編輯記錄」標題', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.getAllByText('編輯記錄').length).toBeGreaterThanOrEqual(1)
    })

    it('不顯示支出／入帳切換（編輯的必為消費紀錄）', () => {
      render(<TransactionFormModal userId="uid-danny" transaction={BASE_TRANSACTION} onClose={onClose} />)
      expect(screen.queryByRole('button', { name: '入帳' })).not.toBeInTheDocument()
    })

    it('編輯他人墊付的紀錄時，該使用者出現在付款方式選項且為選取值', () => {
      render(
        <TransactionFormModal
          userId="uid-peiyu"
          transaction={BASE_TRANSACTION}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      expect(screen.getByRole('button', { name: 'Danny 墊的' })).toBeInTheDocument()
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

    it('預設以共同帳戶送出，payment_method 為 shared', async () => {
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '300' } })
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 300, payment_method: 'shared', created_by: 'uid-danny' })
      )
    })

    it('選擇共同卡後送出，payment_method 為 joint_card', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '500' } })
      await user.click(screen.getByRole('button', { name: '共同卡' }))
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500, payment_method: 'joint_card' })
      )
    })

    it('選擇我墊的後送出，payment_method 為使用者 id', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '500' } })
      await user.click(screen.getByRole('button', { name: '我墊的' }))
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'uid-danny' })
      )
    })

    it('入帳送出時寫入 cash_movements 的入帳紀錄', async () => {
      const user = userEvent.setup()
      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: '入帳' }))
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '10000' } })
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(mockFrom).toHaveBeenCalledWith('cash_movements')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 10000, kind: 'topup', counterparty: null })
      )
    })

    it('送出後記住付款方式，下次開啟預設帶入', async () => {
      const user = userEvent.setup()
      const first = render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '500' } })
      await user.click(screen.getByRole('button', { name: '共同卡' }))
      const ctaBtn = screen.getAllByText('新增記錄').find(el => el.tagName === 'BUTTON')!
      fireEvent.click(ctaBtn)
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      first.unmount()

      render(<TransactionFormModal userId="uid-danny" onClose={onClose} />)
      // 亮起的按鈕帶 bg-accent-soft class
      expect(screen.getByRole('button', { name: '共同卡' }).className).toContain('bg-accent-soft')
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

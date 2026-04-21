import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecurringManager from '@/app/recurring/RecurringManager'
import type { RecurringTransaction } from '@/types/database'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'r-new', amount: 500, type: 'expense', category_id: 'cat-1',
                note: null, paid_by: 'shared', frequency: 'monthly', day_of_month: 1,
                is_active: true, created_by: 'uid-danny', created_at: '',
                category: { id: 'cat-1', name: '餐飲' },
              },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  }),
}))

const CATEGORIES = [{ id: 'cat-1', name: '餐飲' }]

function makeRecurring(overrides: Partial<RecurringTransaction>): RecurringTransaction {
  return {
    id: 'r1',
    amount: 15000,
    type: 'topup',
    category_id: null,
    note: '薪水',
    paid_by: 'shared',
    frequency: 'monthly',
    day_of_month: 5,
    is_active: true,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('RecurringManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('空狀態', () => {
    it('無定期交易時顯示空提示', () => {
      render(<RecurringManager initialRecurring={[]} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByText(/還沒有定期交易/)).toBeInTheDocument()
    })
  })

  describe('定期模板列表', () => {
    it('顯示定期模板金額', () => {
      const items = [makeRecurring({})]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByText(/15,000/)).toBeInTheDocument()
    })

    it('顯示每月頻率與日期', () => {
      const items = [makeRecurring({ frequency: 'monthly', day_of_month: 5 })]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByText(/每月 5 日/)).toBeInTheDocument()
    })

    it('顯示備註', () => {
      const items = [makeRecurring({ note: '薪水' })]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByText(/薪水/)).toBeInTheDocument()
    })

    it('每個模板顯示「今天記一筆」按鈕', () => {
      const items = [makeRecurring({})]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByRole('button', { name: '今天記一筆' })).toBeInTheDocument()
    })

    it('每個模板顯示「停用」按鈕', () => {
      const items = [makeRecurring({})]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.getByRole('button', { name: '停用' })).toBeInTheDocument()
    })
  })

  describe('新增表單切換', () => {
    it('預設不顯示新增表單', () => {
      render(<RecurringManager initialRecurring={[]} categories={CATEGORIES} userId="uid-danny" />)
      expect(screen.queryByText('新增定期模板')).not.toBeInTheDocument()
    })

    it('點擊「+ 新增」顯示表單', async () => {
      const user = userEvent.setup()
      render(<RecurringManager initialRecurring={[]} categories={CATEGORIES} userId="uid-danny" />)
      await user.click(screen.getByRole('button', { name: '+ 新增' }))
      // "新增定期模板" appears both as the form heading and as the submit button text
      expect(screen.getAllByText('新增定期模板').length).toBeGreaterThanOrEqual(1)
    })

    it('點擊「取消」隱藏表單', async () => {
      const user = userEvent.setup()
      render(<RecurringManager initialRecurring={[]} categories={CATEGORIES} userId="uid-danny" />)
      await user.click(screen.getByRole('button', { name: '+ 新增' }))
      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(screen.queryByText('新增定期模板')).not.toBeInTheDocument()
    })
  })

  describe('今天記一筆', () => {
    it('點擊「今天記一筆」後呼叫 router.refresh', async () => {
      const user = userEvent.setup()
      const items = [makeRecurring({})]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      await user.click(screen.getByRole('button', { name: '今天記一筆' }))
      expect(await screen.findByRole('button', { name: '今天記一筆' })).toBeInTheDocument()
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  describe('停用操作', () => {
    it('確認停用後從列表移除', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const user = userEvent.setup()
      const items = [makeRecurring({ note: '薪水' })]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      await user.click(screen.getByRole('button', { name: '停用' }))
      expect(screen.queryByText(/薪水/)).not.toBeInTheDocument()
    })

    it('取消停用後保留在列表', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const user = userEvent.setup()
      const items = [makeRecurring({ note: '薪水' })]
      render(<RecurringManager initialRecurring={items} categories={CATEGORIES} userId="uid-danny" />)
      await user.click(screen.getByRole('button', { name: '停用' }))
      expect(screen.getByText(/薪水/)).toBeInTheDocument()
    })
  })
})

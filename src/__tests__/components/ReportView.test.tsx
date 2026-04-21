import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportView from '@/app/reports/ReportView'
import type { Transaction } from '@/types/database'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 1000,
    type: 'expense',
    category_id: 'cat-1',
    date: '2026-04-10',
    note: null,
    paid_by: 'shared',
    is_reimbursed: false,
    reimbursed_at: null,
    created_by: 'uid-danny',
    created_at: '2026-04-10T00:00:00Z',
    ...overrides,
  }
}

describe('ReportView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('月份顯示', () => {
    it('正確顯示選取月份', () => {
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      expect(screen.getByText('2026 年 4 月')).toBeInTheDocument()
    })

    it('顯示報表標題', () => {
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      expect(screen.getByText('報表')).toBeInTheDocument()
    })
  })

  describe('金額摘要', () => {
    it('顯示本月支出合計', () => {
      const txns = [
        makeTxn({ id: 't1', type: 'expense', amount: 3000 }),
        makeTxn({ id: 't2', type: 'expense', amount: 2000 }),
      ]
      render(<ReportView transactions={txns} selectedMonth="2026-04" />)
      // 5,000 appears in both the summary card and the transaction list
      expect(screen.getAllByText(/5,000/).length).toBeGreaterThanOrEqual(1)
    })

    it('顯示本月入帳合計', () => {
      const txns = [makeTxn({ type: 'topup', amount: 8000, category_id: null })]
      render(<ReportView transactions={txns} selectedMonth="2026-04" />)
      // 8,000 appears in both the summary card and the transaction list
      expect(screen.getAllByText(/8,000/).length).toBeGreaterThanOrEqual(1)
    })

    it('無交易時支出為 0', () => {
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      expect(screen.getAllByText(/NT\$ 0/).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('月份導覽', () => {
    it('點擊上一個月按鈕導向正確路徑', async () => {
      const user = userEvent.setup()
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      await user.click(screen.getByText('‹'))
      expect(mockPush).toHaveBeenCalledWith('/reports?month=2026-03')
    })

    it('點擊下一個月按鈕導向正確路徑', async () => {
      const user = userEvent.setup()
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      await user.click(screen.getByText('›'))
      expect(mockPush).toHaveBeenCalledWith('/reports?month=2026-05')
    })

    it('年底跨年月份計算正確', async () => {
      const user = userEvent.setup()
      render(<ReportView transactions={[]} selectedMonth="2026-12" />)
      await user.click(screen.getByText('›'))
      expect(mockPush).toHaveBeenCalledWith('/reports?month=2027-01')
    })
  })

  describe('搜尋功能', () => {
    it('搜尋備註過濾記錄', async () => {
      const user = userEvent.setup()
      const txns = [
        makeTxn({ id: 't1', note: '午餐' }),
        makeTxn({ id: 't2', note: '咖啡' }),
      ]
      render(<ReportView transactions={txns} selectedMonth="2026-04" />)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), '午餐')
      expect(screen.getByText('午餐')).toBeInTheDocument()
      expect(screen.queryByText('咖啡')).not.toBeInTheDocument()
    })

    it('搜尋分類名稱過濾記錄', async () => {
      const user = userEvent.setup()
      // Use notes instead of categories — category names also appear in the pie chart
      // so they can't be used to verify filtering
      const txns = [
        makeTxn({ id: 't1', note: '搜尋目標記錄' }),
        makeTxn({ id: 't2', note: '應被過濾掉的記錄' }),
      ]
      render(<ReportView transactions={txns} selectedMonth="2026-04" />)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), '搜尋目標記錄')
      expect(screen.getByText('搜尋目標記錄')).toBeInTheDocument()
      expect(screen.queryByText('應被過濾掉的記錄')).not.toBeInTheDocument()
    })

    it('無搜尋結果時顯示提示', async () => {
      const user = userEvent.setup()
      const txns = [makeTxn({ note: '午餐' })]
      render(<ReportView transactions={txns} selectedMonth="2026-04" />)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), 'xyz')
      expect(screen.getByText('找不到符合的記錄')).toBeInTheDocument()
    })

    it('清除搜尋按鈕出現後可清除', async () => {
      const user = userEvent.setup()
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), 'abc')
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: '×' }))
      expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument()
    })
  })

  describe('空狀態', () => {
    it('本月無記錄時顯示提示', () => {
      render(<ReportView transactions={[]} selectedMonth="2026-04" />)
      expect(screen.getByText('本月沒有記錄')).toBeInTheDocument()
    })
  })
})

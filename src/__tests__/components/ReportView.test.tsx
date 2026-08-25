import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportView from '@/app/reports/ReportView'
import type { CashMovement, Transaction } from '@/types/database'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 1000,
    category_id: 'cat-1',
    date: '2026-04-10',
    note: null,
    payment_method: 'shared',
    created_by: 'uid-danny',
    created_at: '2026-04-10T00:00:00Z',
    ...overrides,
  }
}

function makeMovement(overrides: Partial<CashMovement>): CashMovement {
  return {
    id: 'm1',
    amount: 1000,
    date: '2026-04-10',
    kind: 'topup',
    counterparty: null,
    note: null,
    created_by: 'uid-danny',
    created_at: '2026-04-10T00:00:00Z',
    ...overrides,
  }
}

function renderView(
  transactions: Transaction[] = [],
  cashMovements: CashMovement[] = [],
  selectedMonth = '2026-04',
  previousByMonth: Transaction[][] = []
) {
  return render(
    <ReportView
      transactions={transactions}
      cashMovements={cashMovements}
      previousByMonth={previousByMonth}
      selectedMonth={selectedMonth}
    />
  )
}

const foodCategory = {
  id: 'cat-food',
  name: '餐飲',
  emoji: null,
  color: null,
  created_by: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

describe('ReportView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('月份顯示', () => {
    it('正確顯示選取月份', () => {
      renderView()
      expect(screen.getByText('2026 年 4 月')).toBeInTheDocument()
    })

    it('顯示報表標題', () => {
      renderView()
      expect(screen.getByText('報表')).toBeInTheDocument()
    })
  })

  describe('金額摘要', () => {
    it('顯示本月支出合計', () => {
      const txns = [
        makeTxn({ id: 't1', amount: 3000 }),
        makeTxn({ id: 't2', amount: 2000 }),
      ]
      renderView(txns)
      expect(screen.getAllByText(/5,000/).length).toBeGreaterThanOrEqual(1)
    })

    it('顯示本月入帳合計（來自現金移動）', () => {
      const movements = [makeMovement({ kind: 'topup', amount: 8000 })]
      renderView([], movements)
      expect(screen.getAllByText(/8,000/).length).toBeGreaterThanOrEqual(1)
    })

    it('無交易時支出為 0', () => {
      renderView()
      expect(screen.getAllByText(/NT\$ 0/).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('月份導覽', () => {
    it('點擊上一個月按鈕導向正確路徑', async () => {
      const user = userEvent.setup()
      renderView()
      await user.click(screen.getByRole('button', { name: '上一個月' }))
      expect(mockPush).toHaveBeenCalledWith('/reports?month=2026-03')
    })

    it('點擊下一個月按鈕導向正確路徑', async () => {
      const user = userEvent.setup()
      renderView()
      await user.click(screen.getByRole('button', { name: '下一個月' }))
      expect(mockPush).toHaveBeenCalledWith('/reports?month=2026-05')
    })

    it('年底跨年月份計算正確', async () => {
      const user = userEvent.setup()
      renderView([], [], '2026-12')
      await user.click(screen.getByRole('button', { name: '下一個月' }))
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
      renderView(txns)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), '午餐')
      expect(screen.getByText('午餐')).toBeInTheDocument()
      expect(screen.queryByText('咖啡')).not.toBeInTheDocument()
    })

    it('搜尋分類名稱過濾記錄', async () => {
      const user = userEvent.setup()
      const txns = [
        makeTxn({ id: 't1', note: '搜尋目標記錄' }),
        makeTxn({ id: 't2', note: '應被過濾掉的記錄' }),
      ]
      renderView(txns)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), '搜尋目標記錄')
      expect(screen.getByText('搜尋目標記錄')).toBeInTheDocument()
      expect(screen.queryByText('應被過濾掉的記錄')).not.toBeInTheDocument()
    })

    it('無搜尋結果時顯示提示', async () => {
      const user = userEvent.setup()
      const txns = [makeTxn({ note: '午餐' })]
      renderView(txns)
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), 'xyz')
      expect(screen.getByText('找不到符合的記錄')).toBeInTheDocument()
    })

    it('清除搜尋按鈕出現後可清除', async () => {
      const user = userEvent.setup()
      renderView()
      await user.type(screen.getByPlaceholderText('搜尋備註或分類...'), 'abc')
      expect(screen.getByRole('button', { name: '清除' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: '清除' }))
      expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument()
    })
  })

  describe('分類比較', () => {
    it('顯示分類金額與前三月平均的差異文案', () => {
      const current = [makeTxn({ amount: 12400, category_id: foodCategory.id, category: foodCategory })]
      const previous = [
        [makeTxn({ id: 'p1', amount: 9000, date: '2026-03-10', category_id: foodCategory.id, category: foodCategory })],
        [makeTxn({ id: 'p2', amount: 9200, date: '2026-02-10', category_id: foodCategory.id, category: foodCategory })],
        [makeTxn({ id: 'p3', amount: 9400, date: '2026-01-10', category_id: foodCategory.id, category: foodCategory })],
      ]
      renderView(current, [], '2026-04', previous)
      expect(screen.getByText('比前三月平均多 NT$ 3,200')).toBeInTheDocument()
    })

    it('差異在門檻內顯示持平且不顯示差額', () => {
      const current = [makeTxn({ amount: 9300, category_id: foodCategory.id, category: foodCategory })]
      const previous = [
        [makeTxn({ id: 'p1', amount: 9200, date: '2026-03-10', category_id: foodCategory.id, category: foodCategory })],
      ]
      renderView(current, [], '2026-04', previous)
      expect(screen.getByText('與前 1 月平均持平')).toBeInTheDocument()
      expect(screen.queryByText(/比前.*平均/)).not.toBeInTheDocument()
    })

    it('沒有前期資料時如實標示', () => {
      const current = [makeTxn({ amount: 1200, category_id: foodCategory.id, category: foodCategory })]
      renderView(current, [], '2026-04', [])
      expect(screen.getByText('尚無前期資料可比較')).toBeInTheDocument()
    })

    it('本月無任何分類時不渲染比較區塊', () => {
      renderView()
      expect(screen.queryByText('支出分類')).not.toBeInTheDocument()
    })
  })

  describe('空狀態', () => {
    it('本月無記錄時顯示提示', () => {
      renderView()
      expect(screen.getByText('本月沒有記錄')).toBeInTheDocument()
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BalanceSummary from '@/components/BalanceSummary'
import type { BalanceBreakdown } from '@/lib/balance'
import type { MonthTotals } from '@/lib/report'

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

function makeBreakdown(overrides: Partial<BalanceBreakdown>): BalanceBreakdown {
  return {
    cashBalance: 0,
    cardUnbilled: 0,
    advancesByUser: {},
    advanceTotal: 0,
    available: 0,
    ...overrides,
  }
}

const ZERO_TOTALS: MonthTotals = { expenseTotal: 0, topupTotal: 0 }

function renderSummary(
  breakdown: BalanceBreakdown,
  monthTotals: MonthTotals = ZERO_TOTALS,
  handlers: { onRecordCardBill?: () => void; onSettle?: (userId: string, amount: number) => void } = {}
) {
  return render(
    <BalanceSummary
      breakdown={breakdown}
      monthTotals={monthTotals}
      profiles={PROFILES}
      onRecordCardBill={handlers.onRecordCardBill ?? vi.fn()}
      onSettle={handlers.onSettle ?? vi.fn()}
    />
  )
}

describe('BalanceSummary', () => {
  describe('四行拆解', () => {
    it('顯示共同帳戶餘額', () => {
      renderSummary(makeBreakdown({ cashBalance: 50000, available: 50000 }))
      expect(screen.getByText('共同帳戶餘額')).toBeInTheDocument()
      expect(screen.getByTestId('balance-amount')).toHaveTextContent('NT$ 50,000')
    })

    it('有未出帳與待還墊付時顯示四行與可動用', () => {
      renderSummary(
        makeBreakdown({
          cashBalance: 50000,
          cardUnbilled: 12000,
          advancesByUser: { 'uid-danny': 15000, 'uid-peiyu': 5000 },
          advanceTotal: 20000,
          available: 18000,
        })
      )
      expect(screen.getByText('共同卡未出帳')).toBeInTheDocument()
      expect(screen.getByText(/Danny 墊付了 NT\$ 15,000/)).toBeInTheDocument()
      expect(screen.getByText(/PeiYu 墊付了 NT\$ 5,000/)).toBeInTheDocument()
      expect(screen.getByTestId('available-amount')).toHaveTextContent('NT$ 18,000')
    })

    it('無未出帳亦無待還墊付時，隱藏負債與可動用列', () => {
      renderSummary(makeBreakdown({ cashBalance: 10000, available: 10000 }))
      expect(screen.queryByText('共同卡未出帳')).not.toBeInTheDocument()
      expect(screen.queryByText(/墊付了/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('available-amount')).not.toBeInTheDocument()
    })

    it('待還墊付列包含「尚未還清」字樣', () => {
      renderSummary(
        makeBreakdown({
          cashBalance: 10000,
          advancesByUser: { 'uid-peiyu': 2500 },
          advanceTotal: 2500,
          available: 7500,
        })
      )
      expect(screen.getByText(/墊付了.*尚未還清/)).toBeInTheDocument()
    })

    it('餘額為負時 data-negative 屬性存在', () => {
      renderSummary(makeBreakdown({ cashBalance: -5000, available: -5000 }))
      expect(screen.getByTestId('balance-amount')).toHaveAttribute('data-negative', 'true')
    })
  })

  describe('現金移動入口', () => {
    it('點「共同卡未出帳」觸發帳單扣款流程', async () => {
      const user = userEvent.setup()
      const onRecordCardBill = vi.fn()
      renderSummary(
        makeBreakdown({ cashBalance: 10000, cardUnbilled: 3000, available: 7000 }),
        ZERO_TOTALS,
        { onRecordCardBill }
      )
      await user.click(screen.getByTestId('card-unbilled'))
      expect(onRecordCardBill).toHaveBeenCalledOnce()
    })

    it('點某人的待還墊付觸發結算流程，並帶入對象與待還金額', async () => {
      const user = userEvent.setup()
      const onSettle = vi.fn()
      renderSummary(
        makeBreakdown({
          cashBalance: 10000,
          advancesByUser: { 'uid-peiyu': 2500 },
          advanceTotal: 2500,
          available: 7500,
        }),
        ZERO_TOTALS,
        { onSettle }
      )
      await user.click(screen.getByTestId('advance-uid-peiyu'))
      expect(onSettle).toHaveBeenCalledWith('uid-peiyu', 2500)
    })
  })

  describe('本月摘要', () => {
    it('顯示本月支出與本月入帳', () => {
      renderSummary(makeBreakdown({}), { expenseTotal: 3000, topupTotal: 8000 })
      expect(screen.getByText('本月支出')).toBeInTheDocument()
      expect(screen.getByText('-NT$ 3,000')).toBeInTheDocument()
      expect(screen.getByText('本月入帳')).toBeInTheDocument()
      expect(screen.getByText('+NT$ 8,000')).toBeInTheDocument()
    })
  })
})

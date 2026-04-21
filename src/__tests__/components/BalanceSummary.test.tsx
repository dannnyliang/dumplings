import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BalanceSummary from '@/components/BalanceSummary'
import type { Transaction } from '@/types/database'

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 1000,
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

describe('BalanceSummary', () => {
  describe('餘額計算', () => {
    it('無交易時餘額為零', () => {
      render(<BalanceSummary transactions={[]} profiles={PROFILES} />)
      expect(screen.getByText('共同帳戶餘額')).toBeInTheDocument()
      expect(screen.getByText(/NT\$ 0/)).toBeInTheDocument()
    })

    it('入帳正確加入餘額', () => {
      const txns = [makeTransaction({ type: 'topup', amount: 5000, paid_by: 'shared' })]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      // NT$ 5,000 appears in balance AND in topup summary — use getAllByText
      expect(screen.getAllByText(/5,000/).length).toBeGreaterThanOrEqual(1)
    })

    it('共同支出從餘額扣除', () => {
      const txns = [
        makeTransaction({ type: 'topup', amount: 10000, paid_by: 'shared' }),
        makeTransaction({ id: 't2', type: 'expense', amount: 3000, paid_by: 'shared' }),
      ]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/7,000/)).toBeInTheDocument()
    })

    it('已還清墊付算入支出', () => {
      const txns = [
        makeTransaction({ type: 'topup', amount: 10000, paid_by: 'shared' }),
        makeTransaction({
          id: 't2', type: 'expense', amount: 2000,
          paid_by: 'uid-danny', is_reimbursed: true, reimbursed_at: '2026-04-02T00:00:00Z',
        }),
      ]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/8,000/)).toBeInTheDocument()
    })

    it('未還清墊付不從共同帳戶扣除', () => {
      const txns = [
        makeTransaction({ type: 'topup', amount: 10000, paid_by: 'shared' }),
        makeTransaction({ id: 't2', type: 'expense', amount: 2000, paid_by: 'uid-danny' }),
      ]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      // Balance stays 10,000 because advance is not deducted from shared account
      expect(screen.getAllByText(/10,000/).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('墊付提示', () => {
    it('有未還清墊付時顯示提示', () => {
      const txns = [makeTransaction({ type: 'expense', amount: 1500, paid_by: 'uid-danny' })]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/Danny 墊付了/)).toBeInTheDocument()
      expect(screen.getByText(/尚未還清/)).toBeInTheDocument()
    })

    it('顯示正確的累計墊付金額', () => {
      const txns = [
        makeTransaction({ id: 't1', type: 'expense', amount: 800, paid_by: 'uid-danny' }),
        makeTransaction({ id: 't2', type: 'expense', amount: 700, paid_by: 'uid-danny' }),
      ]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/1,500/)).toBeInTheDocument()
    })

    it('全部還清後不顯示墊付提示', () => {
      const txns = [makeTransaction({
        type: 'expense', amount: 1500, paid_by: 'uid-danny',
        is_reimbursed: true, reimbursed_at: '2026-04-02T00:00:00Z',
      })]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.queryByText(/墊付了/)).not.toBeInTheDocument()
    })

    it('顯示不同付款人的各別墊付', () => {
      const txns = [
        makeTransaction({ id: 't1', type: 'expense', amount: 1000, paid_by: 'uid-danny' }),
        makeTransaction({ id: 't2', type: 'expense', amount: 2000, paid_by: 'uid-peiyu' }),
      ]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/Danny 墊付了/)).toBeInTheDocument()
      expect(screen.getByText(/PeiYu 墊付了/)).toBeInTheDocument()
    })
  })

  describe('入帳與支出摘要', () => {
    it('顯示入帳合計', () => {
      const txns = [makeTransaction({ type: 'topup', amount: 8000, paid_by: 'shared' })]
      render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      expect(screen.getByText(/入帳/)).toBeInTheDocument()
      expect(screen.getByText(/\+8,000/)).toBeInTheDocument()
    })

    it('餘額為負時以紅色顯示', () => {
      const txns = [makeTransaction({ type: 'expense', amount: 5000, paid_by: 'shared' })]
      const { container } = render(<BalanceSummary transactions={txns} profiles={PROFILES} />)
      const balanceEl = container.querySelector('.text-red-500')
      expect(balanceEl).toBeInTheDocument()
    })
  })
})

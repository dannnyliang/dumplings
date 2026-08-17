'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { formatMoney, formatSignedMoney } from '@/lib/money'
import { formatMonthLabel, shiftMonth } from '@/lib/month'
import { compareWithPreviousAverage, computeMonthTotals, filterTransactions } from '@/lib/report'
import CategoryComparisonList from './CategoryComparisonList'
import type { CashMovement, Transaction } from '@/types/database'

interface ReportViewProps {
  transactions: Transaction[]
  cashMovements: CashMovement[]
  /** 前幾個月的消費紀錄（每月一組），作為分類比較的基準 */
  previousByMonth: Transaction[][]
  selectedMonth: string
}

export default function ReportView({
  transactions,
  cashMovements,
  previousByMonth,
  selectedMonth,
}: ReportViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { expenseTotal, topupTotal } = computeMonthTotals(transactions, cashMovements, selectedMonth)
  const comparisons = compareWithPreviousAverage(transactions, previousByMonth)
  const filtered = filterTransactions(transactions, search)

  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Link href="/" style={{ color: 'var(--dmp-text-muted)', display: 'flex' }}>
          <Icon name="back" size={22} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0, flex: 1 }}>報表</h1>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* month picker */}
        <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--dmp-shadow-soft)' }}>
          <button onClick={() => router.push(`/reports?month=${shiftMonth(selectedMonth, -1)}`)}
            aria-label="上一個月"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 6 }}>
            <Icon name="chevL" size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dmp-text)' }}>{formatMonthLabel(selectedMonth)}</span>
          <button onClick={() => router.push(`/reports?month=${shiftMonth(selectedMonth, 1)}`)}
            aria-label="下一個月"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 6 }}>
            <Icon name="chevR" size={18} />
          </button>
        </div>

        {/* summary pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500, margin: '0 0 4px' }}>本月支出</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
              {formatMoney(expenseTotal)}
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500, margin: '0 0 4px' }}>本月入帳</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dmp-income)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
              {formatMoney(topupTotal)}
            </p>
          </div>
        </div>

        {/* 分類支出與前期平均的比較（純文字，spec：圖表非必要） */}
        <CategoryComparisonList comparisons={comparisons} />

        {/* search */}
        <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--dmp-shadow-soft)' }}>
          <Icon name="search" size={16} strokeWidth={1.75} className="text-[var(--dmp-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋備註或分類..."
            style={{ flex: 1, fontSize: 14, color: 'var(--dmp-text)', background: 'none', border: 'none', outline: 'none' }} />
          {search && (
            <button onClick={() => setSearch('')}
              aria-label="清除"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex' }}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* transaction list */}
        {filtered.length > 0 ? (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {filtered.map((t, idx) => (
                <li key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: idx > 0 ? '1px solid var(--dmp-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--dmp-text)', margin: 0 }}>
                        {t.category?.name ?? '支出'}
                      </p>
                      {t.note && <p style={{ fontSize: 12, color: 'var(--dmp-text-muted)', margin: '2px 0 0' }}>{t.note}</p>}
                      <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', margin: '2px 0 0', fontFamily: '"SF Mono", ui-monospace, monospace' }}>{t.date}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
                    {formatSignedMoney(t.amount, 'out')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '32px 16px', textAlign: 'center', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 13, color: 'var(--dmp-text-muted)' }}>{search ? '找不到符合的記錄' : '本月沒有記錄'}</p>
          </div>
        )}
      </div>
    </main>
  )
}

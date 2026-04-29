'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Icon from '@/components/ui/Icon'
import { WARM_CHART_COLORS } from '@/lib/tokens'
import type { Transaction } from '@/types/database'

interface ReportViewProps {
  transactions: Transaction[]
  selectedMonth: string
}

function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y} 年 ${Number(m)} 月`
}

export default function ReportView({ transactions, selectedMonth }: ReportViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const expenses = transactions.filter((t) => t.type === 'expense')
  const topups = transactions.filter((t) => t.type === 'topup')

  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalTopup = topups.reduce((s, t) => s + Number(t.amount), 0)

  const categoryMap = expenses.reduce<Record<string, { name: string; value: number }>>((acc, t) => {
    const key = t.category_id ?? 'uncategorized'
    const name = t.category?.name ?? '未分類'
    return {
      ...acc,
      [key]: { name, value: (acc[key]?.value ?? 0) + Number(t.amount) },
    }
  }, {})
  const pieData = Object.values(categoryMap).sort((a, b) => b.value - a.value)

  const filtered = transactions.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.note?.toLowerCase().includes(q) ||
      t.category?.name?.toLowerCase().includes(q)
    )
  })

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
          <button onClick={() => router.push(`/reports?month=${prevMonth(selectedMonth)}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 6 }}>
            <Icon name="chevL" size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dmp-text)' }}>{formatMonth(selectedMonth)}</span>
          <button onClick={() => router.push(`/reports?month=${nextMonth(selectedMonth)}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 6 }}>
            <Icon name="chevR" size={18} />
          </button>
        </div>

        {/* summary pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500, margin: '0 0 4px' }}>本月支出</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
              NT$ {totalExpense.toLocaleString('zh-TW')}
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500, margin: '0 0 4px' }}>本月入帳</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dmp-income)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
              NT$ {totalTopup.toLocaleString('zh-TW')}
            </p>
          </div>
        </div>

        {/* pie chart */}
        {pieData.length > 0 && (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '16px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--dmp-text-soft)', margin: '0 0 12px' }}>支出分類</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={WARM_CHART_COLORS[index % WARM_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`NT$ ${Number(value).toLocaleString('zh-TW')}`, '金額']}
                  contentStyle={{ backgroundColor: 'var(--dmp-surface)', border: '1px solid var(--dmp-border)', borderRadius: 12, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieData.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, backgroundColor: WARM_CHART_COLORS[i % WARM_CHART_COLORS.length], display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: 'var(--dmp-text)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--dmp-text-soft)', fontFamily: '"SF Mono", ui-monospace, monospace' }}>
                    NT$ {item.value.toLocaleString('zh-TW')}
                    <span style={{ color: 'var(--dmp-text-muted)', marginLeft: 6, fontSize: 11 }}>
                      ({totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* search */}
        <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--dmp-shadow-soft)' }}>
          <Icon name="search" size={16} strokeWidth={1.75} className="text-[var(--dmp-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋備註或分類..."
            style={{ flex: 1, fontSize: 14, color: 'var(--dmp-text)', background: 'none', border: 'none', outline: 'none' }} />
          {search && (
            <button onClick={() => setSearch('')}
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
                        {t.category?.name ?? (t.type === 'topup' ? '入帳' : '支出')}
                      </p>
                      {t.note && <p style={{ fontSize: 12, color: 'var(--dmp-text-muted)', margin: '2px 0 0' }}>{t.note}</p>}
                      <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', margin: '2px 0 0', fontFamily: '"SF Mono", ui-monospace, monospace' }}>{t.date}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: t.type === 'topup' ? 'var(--dmp-income)' : 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
                    {t.type === 'topup' ? '+' : '-'}NT$ {Number(t.amount).toLocaleString('zh-TW')}
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

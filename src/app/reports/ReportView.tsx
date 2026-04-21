'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Transaction } from '@/types/database'

interface ReportViewProps {
  transactions: Transaction[]
  selectedMonth: string
}

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

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
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</Link>
        <h1 className="text-lg font-bold text-gray-800">報表</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* month picker */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/reports?month=${prevMonth(selectedMonth)}`)}
            className="text-gray-400 hover:text-gray-600 px-3 py-1 text-lg"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-800">{formatMonth(selectedMonth)}</span>
          <button
            onClick={() => router.push(`/reports?month=${nextMonth(selectedMonth)}`)}
            className="text-gray-400 hover:text-gray-600 px-3 py-1 text-lg"
          >
            ›
          </button>
        </div>

        {/* summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">本月支出</p>
            <p className="text-xl font-bold text-red-500 mt-1">
              NT$ {totalExpense.toLocaleString('zh-TW')}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">本月入帳</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              NT$ {totalTopup.toLocaleString('zh-TW')}
            </p>
          </div>
        </div>

        {/* pie chart */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">支出分類</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`NT$ ${value.toLocaleString('zh-TW')}`, '金額']}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1.5">
              {pieData.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-500">
                    NT$ {item.value.toLocaleString('zh-TW')}
                    <span className="text-gray-400 ml-1 text-xs">
                      ({totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* search */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋備註或分類..."
            className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 text-sm">×</button>
          )}
        </div>

        {/* transaction list */}
        {filtered.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.type === 'topup' ? '💰' : '💸'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {t.category?.name ?? (t.type === 'topup' ? '入帳' : '支出')}
                      </p>
                      {t.note && <p className="text-xs text-gray-400">{t.note}</p>}
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === 'topup' ? 'text-green-600' : 'text-gray-800'}`}>
                    {t.type === 'topup' ? '+' : '-'}NT$ {Number(t.amount).toLocaleString('zh-TW')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
            <p className="text-sm">{search ? '找不到符合的記錄' : '本月沒有記錄'}</p>
          </div>
        )}
      </div>
    </main>
  )
}

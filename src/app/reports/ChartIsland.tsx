'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { WARM_CHART_COLORS } from '@/lib/tokens'

interface PieDatum {
  name: string
  value: number
}

interface ChartIslandProps {
  pieData: PieDatum[]
  totalExpense: number
}

export default function ChartIsland({ pieData, totalExpense }: ChartIslandProps) {
  if (pieData.length === 0) return null

  return (
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
  )
}

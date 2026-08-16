import { lastNDays } from '@/lib/month'
import type { Transaction } from '@/types/database'

interface SparkBarChartProps {
  transactions: Transaction[]
}

const SPARK_DAYS = 14

export default function SparkBarChart({ transactions }: SparkBarChartProps) {
  const days = lastNDays(SPARK_DAYS)

  const maxAmount = Math.max(
    1,
    ...days.map((day) =>
      transactions
        .filter((t) => t.date === day)
        .reduce((sum, t) => sum + Number(t.amount), 0)
    )
  )

  const BAR_W = 14
  const GAP = 4
  const H = 44
  const totalW = days.length * BAR_W + (days.length - 1) * GAP

  return (
    <svg
      width={totalW}
      height={H}
      viewBox={`0 0 ${totalW} ${H}`}
      style={{ display: 'block', width: '100%', height: H }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {days.map((day, i) => {
        const amount = transactions
          .filter((t) => t.date === day)
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const ratio = amount / maxAmount
        const barH = Math.max(4, Math.round(ratio * H))
        const x = i * (BAR_W + GAP)
        const opacity = amount === 0 ? 0.25 : 0.55 + ratio * 0.45

        return (
          <rect
            key={day}
            x={x}
            y={H - barH}
            width={BAR_W}
            height={barH}
            rx={3}
            fill="var(--dmp-accent)"
            opacity={opacity}
          />
        )
      })}
    </svg>
  )
}

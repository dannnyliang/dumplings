import { formatMoney } from '@/lib/money'
import { comparisonText } from '@/lib/report'
import type { CategoryComparison } from '@/lib/report'

interface CategoryComparisonListProps {
  comparisons: CategoryComparison[]
}

function deltaClassName(comparison: CategoryComparison): string {
  if (comparison.baselineMonths === 0 || comparison.isFlat) return 'text-muted'
  return comparison.delta > 0 ? 'text-expense' : 'text-income'
}

/** 分類支出與前期平均的比較，純文字呈現（spec：圖表非必要）。 */
export default function CategoryComparisonList({ comparisons }: CategoryComparisonListProps) {
  if (comparisons.length === 0) return null

  return (
    <div className="bg-surface rounded-[20px] p-4 shadow-soft">
      <p className="m-0 mb-3 text-[13px] font-semibold text-soft">支出分類</p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {comparisons.map((c) => (
          <li key={c.name} className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-[14px] font-medium text-text">{c.name}</p>
              <p className={`m-0 mt-0.5 text-[12px] ${deltaClassName(c)}`}>{comparisonText(c)}</p>
            </div>
            <p className="m-0 shrink-0 font-mono text-[14px] font-semibold text-text">
              {formatMoney(c.amount)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

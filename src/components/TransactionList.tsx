import type { Transaction } from '@/types/database'

interface TransactionListProps {
  transactions: Transaction[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

function getPaidByLabel(paidBy: string): string {
  if (paidBy === 'shared') return ''
  return '墊付'
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
        <p className="text-4xl mb-2">🥟</p>
        <p className="text-sm">還沒有記錄，開始記帳吧！</p>
      </div>
    )
  }

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = t.date
    return { ...acc, [key]: [...(acc[key] ?? []), t] }
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">{formatDate(date)}</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.type === 'topup' ? '💰' : '💸'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {t.category?.name ?? (t.type === 'topup' ? '入帳' : '支出')}
                    </p>
                    {t.note && (
                      <p className="text-xs text-gray-400">{t.note}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${t.type === 'topup' ? 'text-green-600' : 'text-gray-800'}`}>
                    {t.type === 'topup' ? '+' : '-'}NT$ {Number(t.amount).toLocaleString('zh-TW')}
                  </p>
                  {getPaidByLabel(t.paid_by) && (
                    <span className="text-xs text-orange-500">{getPaidByLabel(t.paid_by)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

import type { Transaction } from '@/types/database'

interface BalanceSummaryProps {
  transactions: Transaction[]
  profiles: Record<string, string>
}

export default function BalanceSummary({ transactions, profiles }: BalanceSummaryProps) {
  const topupTotal = transactions
    .filter((t) => t.type === 'topup')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const sharedExpenseTotal = transactions
    .filter((t) => t.type === 'expense' && (t.paid_by === 'shared' || t.is_reimbursed))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = topupTotal - sharedExpenseTotal

  const advancesByPayer = transactions
    .filter((t) => t.type === 'expense' && t.paid_by !== 'shared' && !t.is_reimbursed)
    .reduce<Record<string, number>>((acc, t) => {
      const key = t.paid_by
      return { ...acc, [key]: (acc[key] ?? 0) + Number(t.amount) }
    }, {})

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">共同帳戶餘額</p>
      <p className={`text-3xl font-bold ${balance >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
        NT$ {balance.toLocaleString('zh-TW')}
      </p>
      <div className="flex gap-4 mt-3 text-sm text-gray-500">
        <span>入帳 <span className="text-green-600 font-medium">+{topupTotal.toLocaleString('zh-TW')}</span></span>
        <span>支出 <span className="text-red-500 font-medium">-{sharedExpenseTotal.toLocaleString('zh-TW')}</span></span>
      </div>

      {Object.entries(advancesByPayer).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          {Object.entries(advancesByPayer).map(([payerId, total]) => (
            <p key={payerId} className="text-xs text-orange-500">
              {profiles[payerId] ?? '某人'} 墊付了 NT$ {total.toLocaleString('zh-TW')}，尚未還清
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

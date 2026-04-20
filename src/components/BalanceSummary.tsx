import type { Transaction } from '@/types/database'

interface BalanceSummaryProps {
  transactions: Transaction[]
}

export default function BalanceSummary({ transactions }: BalanceSummaryProps) {
  const topupTotal = transactions
    .filter((t) => t.type === 'topup')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const sharedExpenseTotal = transactions
    .filter((t) => t.type === 'expense' && (t.paid_by === 'shared' || t.is_reimbursed))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = topupTotal - sharedExpenseTotal

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
    </div>
  )
}

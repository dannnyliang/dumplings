import type { Transaction } from '@/types/database'

interface BalanceSummaryProps {
  transactions: Transaction[]
  profiles: Record<string, string>
}

interface StatPillProps {
  label: string
  amount: number
  color: string
  softBg: string
  prefix: string
}

function StatPill({ label, amount, color, softBg, prefix }: StatPillProps) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: softBg,
      borderRadius: 14,
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <span style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
        {prefix}NT$ {amount.toLocaleString('zh-TW')}
      </span>
    </div>
  )
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
    <div style={{
      backgroundColor: 'var(--dmp-surface)',
      borderRadius: 32,
      padding: 22,
      boxShadow: 'var(--dmp-shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div>
        <p style={{ fontSize: 11, color: 'var(--dmp-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          共同帳戶餘額
        </p>
        <p
          data-testid="balance-amount"
          data-negative={balance < 0 ? 'true' : undefined}
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: balance >= 0 ? 'var(--dmp-text)' : 'var(--dmp-expense-b)',
            fontFamily: '"SF Mono", ui-monospace, monospace',
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          NT$ {balance.toLocaleString('zh-TW')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <StatPill
          label="本月支出"
          amount={sharedExpenseTotal}
          color="var(--dmp-expense-b)"
          softBg="var(--dmp-accent-soft)"
          prefix="-"
        />
        <StatPill
          label="本月入帳"
          amount={topupTotal}
          color="var(--dmp-income)"
          softBg="var(--dmp-income-soft)"
          prefix="+"
        />
      </div>

      {Object.entries(advancesByPayer).length > 0 && (
        <div style={{ borderTop: '1px solid var(--dmp-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(advancesByPayer).map(([payerId, total]) => (
            <p key={payerId} style={{ fontSize: 12, color: 'var(--dmp-accent)', fontWeight: 500 }}>
              {profiles[payerId] ?? '某人'} 墊付了 NT$ {total.toLocaleString('zh-TW')}，尚未還清
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

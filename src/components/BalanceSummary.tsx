import { formatMoney, formatSignedMoney } from '@/lib/money'
import type { BalanceBreakdown } from '@/lib/balance'
import type { MonthTotals } from '@/lib/report'

interface BalanceSummaryProps {
  breakdown: BalanceBreakdown
  monthTotals: MonthTotals
  profiles: Record<string, string>
  /** 點「共同卡未出帳」→ 記一筆帳單扣款 */
  onRecordCardBill: () => void
  /** 點某人的待還墊付 → 結算給該對象（金額預設帶入其待還總額） */
  onSettle: (userId: string, outstanding: number) => void
}

interface StatPillProps {
  label: string
  amount: number
  colorClass: string
  bgClass: string
  prefix: string
}

function StatPill({ label, amount, colorClass, bgClass, prefix }: StatPillProps) {
  return (
    <div className={`flex flex-1 flex-col gap-0.5 rounded-[14px] px-3.5 py-2.5 ${bgClass}`}>
      <span className="text-muted text-[11px] font-medium">{label}</span>
      <span className={`font-mono text-[15px] font-bold ${colorClass}`}>
        {prefix}
        {formatMoney(amount)}
      </span>
    </div>
  )
}

/**
 * 首頁餘額四行拆解：共同帳戶餘額（現金）、共同卡未出帳與待還墊付（應計負債）、可動用。
 * 負債兩類本身是入口——點未出帳記帳單扣款、點待還墊付記結算。
 */
export default function BalanceSummary({
  breakdown,
  monthTotals,
  profiles,
  onRecordCardBill,
  onSettle,
}: BalanceSummaryProps) {
  const { cashBalance, cardUnbilled, advancesByUser, available } = breakdown
  const advanceEntries = Object.entries(advancesByUser)
  const hasLiabilities = cardUnbilled !== 0 || advanceEntries.length > 0

  return (
    <div className="bg-surface shadow-card flex flex-col gap-4 rounded-[2rem] p-[22px]">
      <div>
        <p className="text-muted mb-1.5 text-[11px] font-medium tracking-[0.8px] uppercase">
          共同帳戶餘額
        </p>
        <p
          data-testid="balance-amount"
          data-negative={cashBalance < 0 ? 'true' : undefined}
          className={`font-mono text-[40px] leading-none font-bold tracking-[-0.5px] ${
            cashBalance >= 0 ? 'text-text' : 'text-expense-strong'
          }`}
        >
          {formatMoney(cashBalance)}
        </p>
      </div>

      {hasLiabilities && (
        <div className="border-line flex flex-col gap-1 border-t pt-3">
          {cardUnbilled !== 0 && (
            <button
              type="button"
              data-testid="card-unbilled"
              onClick={onRecordCardBill}
              className="text-accent flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-left text-[13px] font-medium"
            >
              <span>共同卡未出帳</span>
              {/* 扣款超過累計消費時未出帳為負（多扣的部分下期收斂），以 + 顯示 */}
              <span className="font-mono">
                {formatSignedMoney(Math.abs(cardUnbilled), cardUnbilled >= 0 ? 'out' : 'in')}
              </span>
            </button>
          )}

          {advanceEntries.map(([payerId, outstanding]) => (
            <button
              key={payerId}
              type="button"
              data-testid={`advance-${payerId}`}
              onClick={() => onSettle(payerId, outstanding)}
              className="text-accent w-full cursor-pointer border-none bg-transparent p-0 text-left text-[13px] font-medium"
            >
              {profiles[payerId] ?? '某人'} 墊付了 {formatMoney(outstanding)}，尚未還清
            </button>
          ))}

          <div className="border-line mt-1.5 flex items-center justify-between border-t pt-2">
            <span className="text-soft text-[13px] font-semibold">可動用</span>
            <span
              data-testid="available-amount"
              className={`font-mono text-[15px] font-bold ${
                available >= 0 ? 'text-text' : 'text-expense-strong'
              }`}
            >
              {formatMoney(available)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2.5">
        <StatPill
          label="本月支出"
          amount={monthTotals.expenseTotal}
          colorClass="text-expense-strong"
          bgClass="bg-accent-soft"
          prefix="-"
        />
        <StatPill
          label="本月入帳"
          amount={monthTotals.topupTotal}
          colorClass="text-income"
          bgClass="bg-income-soft"
          prefix="+"
        />
      </div>
    </div>
  )
}

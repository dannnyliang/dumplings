import { test, expect } from '@playwright/test'
import { ensureTestUsers, signInAs, resetTransactions } from './fixtures/auth'
import { seedTransactions, sequentialDates } from './fixtures/seed'

let userIds: Record<'danny' | 'peiyu', string>

test.beforeAll(async () => {
  userIds = await ensureTestUsers()
})

test.beforeEach(async () => {
  await resetTransactions()
})

test('首頁餘額等於入帳減共同支出', async ({ page, context }) => {
  await seedTransactions([
    { amount: 10000, type: 'topup', paidBy: 'shared', date: '2026-01-01', createdBy: userIds.danny },
    { amount: 3000, type: 'expense', paidBy: 'shared', date: '2026-01-02', createdBy: userIds.danny },
  ])
  await signInAs(context, 'danny')

  await page.goto('/')

  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 7,000')
})

test('未清償的代墊不計入共同支出', async ({ page, context }) => {
  await seedTransactions([
    { amount: 10000, type: 'topup', paidBy: 'shared', date: '2026-01-01', createdBy: userIds.danny },
    // PeiYu 先墊，尚未還清：不影響共同帳戶餘額
    { amount: 2500, type: 'expense', paidBy: userIds.peiyu, date: '2026-01-02', createdBy: userIds.peiyu },
  ])
  await signInAs(context, 'danny')

  await page.goto('/')

  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 10,000')
  await expect(page.getByText(/墊付了.*尚未還清/)).toBeVisible()
})

test('一方建立的交易，另一方看得到（household 共享 RLS）', async ({ page, context }) => {
  await seedTransactions([
    {
      amount: 1234,
      type: 'expense',
      paidBy: 'shared',
      date: '2026-01-05',
      note: 'Danny 記的帳',
      createdBy: userIds.danny,
    },
  ])
  await signInAs(context, 'peiyu')

  await page.goto('/')

  await expect(page.getByText('Danny 記的帳')).toBeVisible()
})

/**
 * 已知缺陷，尚未修復——見 openspec/changes/2026-08-09-account-based-ledger/proposal.md。
 *
 * src/app/page.tsx 以 listRecentTransactions（.limit(100)）取資料後直接餵給
 * BalanceSummary，因此交易數超過 100 筆時，最舊的紀錄會滑出視窗，餘額隨新增
 * 交易而漂移。此測試在缺陷修復後應移除 fixme 標記，作為驗收條件。
 */
test.fixme('餘額不受明細筆數上限影響', async ({ page, context }) => {
  const dates = sequentialDates(101)
  await seedTransactions(
    dates.map((date) => ({
      amount: 100,
      type: 'topup' as const,
      paidBy: 'shared',
      date,
      createdBy: userIds.danny,
    }))
  )
  await signInAs(context, 'danny')

  await page.goto('/')

  // 101 筆 × 100 = 10,100；只取最近 100 筆會得到 10,000
  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 10,100')
})

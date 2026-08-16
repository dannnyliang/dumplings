import { test, expect } from '@playwright/test'
import { ensureTestUsers, resetTransactions, signInAs, userClient } from './fixtures/auth'
import { seedLedger, sequentialDates } from './fixtures/seed'

/**
 * account-based-ledger 新模型的煙霧測試。
 * 舊模型的等值行為（餘額計算、household 共享、代墊提示）由 ledger.spec.ts
 * 經 fixture 轉譯層持續驗證；這裡只放新模型特有的行為。
 */

let userIds: Record<'danny' | 'peiyu', string>

test.beforeAll(async () => {
  userIds = await ensureTestUsers()
})

test.beforeEach(async () => {
  await resetTransactions()
})

test('首頁餘額四行拆解：現金、未出帳、待還墊付、可動用', async ({ page, context }) => {
  await seedLedger({
    movements: [
      { amount: 50000, kind: 'topup', date: '2026-01-01', createdBy: userIds.danny },
    ],
    expenses: [
      { amount: 12000, paymentMethod: 'joint_card', date: '2026-01-02', createdBy: userIds.danny },
      { amount: 15000, paymentMethod: userIds.danny, date: '2026-01-03', createdBy: userIds.danny },
      { amount: 5000, paymentMethod: userIds.peiyu, date: '2026-01-04', createdBy: userIds.peiyu },
    ],
  })
  await signInAs(context, 'danny')

  await page.goto('/')

  // 共同卡消費與墊付不動現金餘額
  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 50,000')
  await expect(page.getByTestId('card-unbilled')).toContainText('NT$ 12,000')
  await expect(page.getByTestId(`advance-${userIds.danny}`)).toContainText('NT$ 15,000')
  await expect(page.getByTestId(`advance-${userIds.peiyu}`)).toContainText('NT$ 5,000')
  await expect(page.getByTestId('available-amount')).toHaveText('NT$ 18,000')
})

test('餘額不受明細筆數上限影響', async ({ page, context }) => {
  const dates = sequentialDates(101)
  await seedLedger({
    movements: dates.map((date) => ({
      amount: 100,
      kind: 'topup' as const,
      date,
      createdBy: userIds.danny,
    })),
  })
  await signInAs(context, 'danny')

  await page.goto('/')

  // 101 筆 × 100 = 10,100；若餘額被顯示筆數截斷會得到 10,000
  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 10,100')
})

test('部分結算：預設帶入待還總額，改為部分金額後差額保留', async ({ page, context }) => {
  await seedLedger({
    movements: [
      { amount: 30000, kind: 'topup', date: '2026-01-01', createdBy: userIds.danny },
    ],
    expenses: [
      { amount: 20000, paymentMethod: userIds.peiyu, date: '2026-01-02', createdBy: userIds.peiyu },
    ],
  })
  await signInAs(context, 'danny')

  await page.goto('/')
  await page.getByTestId(`advance-${userIds.peiyu}`).click()

  // 金額預設帶入 PeiYu 目前的待還總額
  const amountInput = page.getByPlaceholder('0')
  await expect(amountInput).toHaveValue('20000')

  // 改為部分金額送出
  await amountInput.fill('15000')
  await page.getByRole('button', { name: '新增記錄' }).click()

  // 現金減少 15,000、待還保留 5,000
  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 15,000')
  await expect(page.getByTestId(`advance-${userIds.peiyu}`)).toContainText('NT$ 5,000')
})

test('帳單扣款：金額與累計未出帳不符時顯示差額提示', async ({ page, context }) => {
  await seedLedger({
    movements: [
      { amount: 50000, kind: 'topup', date: '2026-01-01', createdBy: userIds.danny },
    ],
    expenses: [
      { amount: 23200, paymentMethod: 'joint_card', date: '2026-01-02', createdBy: userIds.danny },
    ],
  })
  await signInAs(context, 'danny')

  await page.goto('/')
  await page.getByTestId('card-unbilled').click()

  await page.getByPlaceholder('0').fill('23450')
  await expect(page.getByText(/相差 NT\$ 250/)).toBeVisible()
  await expect(page.getByText(/可能有消費未記錄/)).toBeVisible()

  // 送出後現金與未出帳同時扣減：未出帳歸負 250 保留於下一期收斂
  await page.getByRole('button', { name: '新增記錄' }).click()
  await expect(page.getByTestId('balance-amount')).toHaveText('NT$ 26,550')
})

test('cash_movements RLS：兩位使用者皆可讀寫彼此的紀錄', async () => {
  const danny = await userClient('danny')
  const peiyu = await userClient('peiyu')

  // Danny 建立一筆入帳
  const { data: created, error: insertError } = await danny
    .from('cash_movements')
    .insert({
      amount: 1000,
      date: '2026-01-01',
      kind: 'topup',
      counterparty: null,
      note: 'RLS 驗證',
      created_by: userIds.danny,
    })
    .select()
    .single()
  expect(insertError).toBeNull()

  // PeiYu 可讀取
  const { data: readByPeiyu, error: readError } = await peiyu
    .from('cash_movements')
    .select('*')
    .eq('id', created!.id)
    .single()
  expect(readError).toBeNull()
  expect(Number(readByPeiyu!.amount)).toBe(1000)

  // PeiYu 可修改 Danny 建立的紀錄
  const { error: updateError } = await peiyu
    .from('cash_movements')
    .update({ amount: 1500 })
    .eq('id', created!.id)
  expect(updateError).toBeNull()

  const { data: afterUpdate } = await danny
    .from('cash_movements')
    .select('amount')
    .eq('id', created!.id)
    .single()
  expect(Number(afterUpdate!.amount)).toBe(1500)

  // 不可冒名建立（insert 的 created_by 限本人）
  const { error: impersonateError } = await peiyu.from('cash_movements').insert({
    amount: 999,
    date: '2026-01-01',
    kind: 'topup',
    counterparty: null,
    note: null,
    created_by: userIds.danny,
  })
  expect(impersonateError).not.toBeNull()
})

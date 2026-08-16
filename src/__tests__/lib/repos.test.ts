import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createTransaction, listTransactionsInMonth } from '@/lib/repos/transactions'
import { listActiveCategories } from '@/lib/repos/categories'
import { createRecurring, deactivateRecurring, RECURRING_WITH_CATEGORY } from '@/lib/repos/recurring'

describe('transactions repo', () => {
  it('createTransaction inserts the payload into transactions', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }))
    const from = vi.fn(() => ({ insert }))
    const supabase = { from } as unknown as SupabaseClient

    const payload = {
      amount: 500,
      category_id: 'cat-1',
      date: '2026-04-01',
      note: null,
      payment_method: 'joint_card',
      created_by: 'uid-danny',
    }
    await createTransaction(supabase, payload)

    expect(from).toHaveBeenCalledWith('transactions')
    expect(insert).toHaveBeenCalledWith(payload)
  })

  it('listTransactionsInMonth bounds the query to the month range', async () => {
    const order = vi.fn(() => Promise.resolve({ data: [], error: null }))
    const lte = vi.fn(() => ({ order }))
    const gte = vi.fn(() => ({ lte }))
    const select = vi.fn(() => ({ gte }))
    const from = vi.fn(() => ({ select }))
    const supabase = { from } as unknown as SupabaseClient

    await listTransactionsInMonth(supabase, '2026-02')

    expect(gte).toHaveBeenCalledWith('date', '2026-02-01')
    expect(lte).toHaveBeenCalledWith('date', '2026-02-28')
  })

})

describe('categories repo', () => {
  it('listActiveCategories filters on is_active and orders by name', async () => {
    const order = vi.fn(() => Promise.resolve({ data: [], error: null }))
    const eq = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    const supabase = { from } as unknown as SupabaseClient

    await listActiveCategories(supabase)

    expect(from).toHaveBeenCalledWith('categories')
    expect(eq).toHaveBeenCalledWith('is_active', true)
    expect(order).toHaveBeenCalledWith('name')
  })
})

describe('recurring repo', () => {
  it('createRecurring inserts and returns the row with its category join', async () => {
    const single = vi.fn(() => Promise.resolve({ data: null, error: null }))
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const from = vi.fn(() => ({ insert }))
    const supabase = { from } as unknown as SupabaseClient

    await createRecurring(supabase, {
      amount: 100,
      type: 'expense',
      category_id: 'cat-1',
      note: null,
      paid_by: 'shared',
      frequency: 'monthly',
      day_of_month: 1,
      created_by: 'uid-danny',
    })

    expect(from).toHaveBeenCalledWith('recurring_transactions')
    expect(select).toHaveBeenCalledWith(RECURRING_WITH_CATEGORY)
  })

  it('deactivateRecurring flips is_active off for the given id', async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }))
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    const supabase = { from } as unknown as SupabaseClient

    await deactivateRecurring(supabase, 'r1')

    expect(update).toHaveBeenCalledWith({ is_active: false })
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })
})

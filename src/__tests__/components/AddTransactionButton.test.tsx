import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTransactionButton from '@/components/AddTransactionButton'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'uid-danny' } } })) },
  }),
}))

vi.mock('@/components/TransactionsMutationContext', () => ({
  useMutateTransactions:
    () => (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
}))

describe('AddTransactionButton', () => {
  it('預設不顯示 modal', () => {
    render(<AddTransactionButton userId="uid-danny" />)
    expect(screen.queryByText('新增記錄')).not.toBeInTheDocument()
  })

  it('收到 dmp:open-add 事件後開啟 modal', async () => {
    render(<AddTransactionButton userId="uid-danny" />)
    await act(async () => {
      window.dispatchEvent(new CustomEvent('dmp:open-add'))
    })
    expect(screen.getAllByText('新增記錄').length).toBeGreaterThanOrEqual(1)
  })

  it('modal 關閉後不再顯示', async () => {
    const user = userEvent.setup()
    render(<AddTransactionButton userId="uid-danny" />)
    await act(async () => {
      window.dispatchEvent(new CustomEvent('dmp:open-add'))
    })
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByText('新增記錄')).not.toBeInTheDocument()
  })
})

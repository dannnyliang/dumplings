import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('AddTransactionButton', () => {
  it('顯示 + 按鈕', () => {
    render(<AddTransactionButton userId="uid-danny" />)
    expect(screen.getByRole('button', { name: '新增記帳' })).toBeInTheDocument()
  })

  it('點擊按鈕後開啟 TransactionFormModal', async () => {
    const user = userEvent.setup()
    render(<AddTransactionButton userId="uid-danny" />)
    await user.click(screen.getByRole('button', { name: '新增記帳' }))
    expect(screen.getByText('新增記錄')).toBeInTheDocument()
  })

  it('modal 關閉後不再顯示', async () => {
    const user = userEvent.setup()
    render(<AddTransactionButton userId="uid-danny" />)
    await user.click(screen.getByRole('button', { name: '新增記帳' }))
    await user.click(screen.getByRole('button', { name: '×' }))
    expect(screen.queryByText('新增記錄')).not.toBeInTheDocument()
  })
})

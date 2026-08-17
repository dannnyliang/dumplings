import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '@/app/login/page'

const mockPush = vi.fn()
const mockSignInWithPassword = vi.fn(() => Promise.resolve({ error: null }))
const mockSignInWithOAuth = vi.fn(() => Promise.resolve({ error: null }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('顯示 Google 登入按鈕', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /使用 Google 帳號登入/ })).toBeInTheDocument()
  })

  it('非 preview 環境不顯示帳密登入表單', () => {
    render(<LoginPage />)
    expect(screen.queryByText('Preview 測試登入')).not.toBeInTheDocument()
  })

  describe('preview 環境', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    })

    it('顯示測試帳號登入表單', () => {
      render(<LoginPage />)
      expect(screen.getByText('Preview 測試登入')).toBeInTheDocument()
      expect(screen.getByLabelText('測試帳號')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('密碼')).toBeInTheDocument()
    })

    it('密碼為空時送出按鈕為 disabled', () => {
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: '以測試帳號登入' })).toBeDisabled()
    })

    it('以選取的帳號與密碼登入，成功後導向首頁', async () => {
      render(<LoginPage />)
      fireEvent.change(screen.getByLabelText('測試帳號'), {
        target: { value: 'preview-peiyu@dumplings.test' },
      })
      fireEvent.change(screen.getByPlaceholderText('密碼'), { target: { value: 'secret' } })
      fireEvent.click(screen.getByRole('button', { name: '以測試帳號登入' }))

      await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'preview-peiyu@dumplings.test',
        password: 'secret',
      })
    })

    it('登入失敗時顯示錯誤訊息且不導向', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' } as unknown as null,
      })
      render(<LoginPage />)
      fireEvent.change(screen.getByPlaceholderText('密碼'), { target: { value: 'wrong' } })
      fireEvent.click(screen.getByRole('button', { name: '以測試帳號登入' }))

      expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})

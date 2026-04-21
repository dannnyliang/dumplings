import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryManager from '@/app/categories/CategoryManager'
import type { Category } from '@/types/database'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'cat-new', name: '購物', is_active: true, created_by: 'uid-danny', created_at: '' },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'uid-danny' } } })),
    },
  }),
}))

const SYSTEM_CAT: Category = { id: 'cat-1', name: '餐飲', is_active: true, created_by: null, created_at: '' }
const USER_CAT: Category = { id: 'cat-2', name: '自訂', is_active: true, created_by: 'uid-danny', created_at: '' }
const INACTIVE_CAT: Category = { id: 'cat-3', name: '停用分類', is_active: false, created_by: null, created_at: '' }

describe('CategoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('顯示分類管理標題', () => {
      render(<CategoryManager initialCategories={[]} />)
      expect(screen.getByText('分類管理')).toBeInTheDocument()
    })

    it('顯示新增分類表單', () => {
      render(<CategoryManager initialCategories={[]} />)
      expect(screen.getByPlaceholderText('新分類名稱...')).toBeInTheDocument()
    })

    it('顯示使用中分類', () => {
      render(<CategoryManager initialCategories={[SYSTEM_CAT]} />)
      expect(screen.getByText('餐飲')).toBeInTheDocument()
      expect(screen.getByText('使用中')).toBeInTheDocument()
    })

    it('顯示已停用分類', () => {
      render(<CategoryManager initialCategories={[INACTIVE_CAT]} />)
      expect(screen.getByText('停用分類')).toBeInTheDocument()
      expect(screen.getByText('已停用')).toBeInTheDocument()
    })
  })

  describe('刪除按鈕可見性', () => {
    it('系統分類不顯示刪除按鈕', () => {
      render(<CategoryManager initialCategories={[SYSTEM_CAT]} />)
      expect(screen.queryByRole('button', { name: '刪除' })).not.toBeInTheDocument()
    })

    it('使用者自訂分類顯示刪除按鈕', () => {
      render(<CategoryManager initialCategories={[USER_CAT]} />)
      expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument()
    })
  })

  describe('停用/啟用按鈕', () => {
    it('使用中分類顯示停用按鈕', () => {
      render(<CategoryManager initialCategories={[SYSTEM_CAT]} />)
      expect(screen.getByRole('button', { name: '停用' })).toBeInTheDocument()
    })

    it('已停用分類顯示啟用按鈕', () => {
      render(<CategoryManager initialCategories={[INACTIVE_CAT]} />)
      expect(screen.getByRole('button', { name: '啟用' })).toBeInTheDocument()
    })
  })

  describe('新增分類', () => {
    it('名稱為空時新增按鈕 disabled', () => {
      render(<CategoryManager initialCategories={[]} />)
      const submitBtn = screen.getByRole('button', { name: '新增' })
      expect(submitBtn).toBeDisabled()
    })

    it('輸入名稱後啟用新增按鈕', async () => {
      const user = userEvent.setup()
      render(<CategoryManager initialCategories={[]} />)
      await user.type(screen.getByPlaceholderText('新分類名稱...'), '購物')
      expect(screen.getByRole('button', { name: '新增' })).not.toBeDisabled()
    })

    it('送出表單後新分類出現在列表', async () => {
      render(<CategoryManager initialCategories={[]} />)
      const input = screen.getByPlaceholderText('新分類名稱...')
      fireEvent.change(input, { target: { value: '購物' } })
      fireEvent.submit(input.closest('form')!)
      expect(await screen.findByText('購物')).toBeInTheDocument()
    })
  })

  describe('停用/啟用操作', () => {
    it('點擊停用後分類移至已停用區', async () => {
      const user = userEvent.setup()
      render(<CategoryManager initialCategories={[SYSTEM_CAT]} />)
      await user.click(screen.getByRole('button', { name: '停用' }))
      expect(await screen.findByText('已停用')).toBeInTheDocument()
    })

    it('點擊啟用後分類移至使用中區', async () => {
      const user = userEvent.setup()
      render(<CategoryManager initialCategories={[INACTIVE_CAT]} />)
      await user.click(screen.getByRole('button', { name: '啟用' }))
      expect(await screen.findByText('使用中')).toBeInTheDocument()
    })
  })

  describe('刪除操作', () => {
    it('確認刪除後分類從列表移除', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const user = userEvent.setup()
      render(<CategoryManager initialCategories={[USER_CAT]} />)
      await user.click(screen.getByRole('button', { name: '刪除' }))
      expect(screen.queryByText('自訂')).not.toBeInTheDocument()
    })

    it('取消刪除後分類保留在列表', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const user = userEvent.setup()
      render(<CategoryManager initialCategories={[USER_CAT]} />)
      await user.click(screen.getByRole('button', { name: '刪除' }))
      expect(screen.getByText('自訂')).toBeInTheDocument()
    })
  })
})

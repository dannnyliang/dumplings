import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/BottomNav'

const mockUsePathname = vi.fn()
const mockPrefetch = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ prefetch: mockPrefetch, push: mockPush, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style, onClick, className }: { href: string; children: React.ReactNode; style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void; className?: string }) => (
    <a href={href} style={style} onClick={onClick} className={className}>{children}</a>
  ),
}))

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('只顯示首頁與報表兩個導覽項目（3 格：首頁／FAB／報表）', () => {
    render(<BottomNav />)
    expect(screen.getByText('首頁')).toBeInTheDocument()
    expect(screen.getByText('報表')).toBeInTheDocument()
    expect(screen.queryByText('分類')).not.toBeInTheDocument()
    expect(screen.queryByText('定期')).not.toBeInTheDocument()
  })

  it('首頁路徑時首頁 tab 為 active（fontWeight 600）', () => {
    mockUsePathname.mockReturnValue('/')
    render(<BottomNav />)
    const homeLink = screen.getByText('首頁').closest('a')
    expect(homeLink?.style.fontWeight).toBe('600')
  })

  it('首頁路徑時其他 tab 為 inactive（fontWeight 500）', () => {
    mockUsePathname.mockReturnValue('/')
    render(<BottomNav />)
    const reportsLink = screen.getByText('報表').closest('a')
    expect(reportsLink?.style.fontWeight).toBe('500')
  })

  it('/reports 路徑時報表 tab 為 active', () => {
    mockUsePathname.mockReturnValue('/reports')
    render(<BottomNav />)
    const reportsLink = screen.getByText('報表').closest('a')
    expect(reportsLink?.style.fontWeight).toBe('600')
  })

  it('非主導覽頁（如設定）時兩個 tab 都 inactive，FAB 顯示回首頁', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<BottomNav />)
    expect(screen.getByText('首頁').closest('a')?.style.fontWeight).toBe('500')
    expect(screen.getByText('報表').closest('a')?.style.fontWeight).toBe('500')
    expect(screen.getByRole('button', { name: '回到首頁' })).toBeInTheDocument()
  })

  it('連結指向正確的 href', () => {
    render(<BottomNav />)
    expect(screen.getByText('首頁').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('報表').closest('a')).toHaveAttribute('href', '/reports')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/BottomNav'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style }: { href: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <a href={href} style={style}>{children}</a>
  ),
}))

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('顯示全部 4 個導覽項目', () => {
    render(<BottomNav />)
    expect(screen.getByText('首頁')).toBeInTheDocument()
    expect(screen.getByText('報表')).toBeInTheDocument()
    expect(screen.getByText('分類')).toBeInTheDocument()
    expect(screen.getByText('定期')).toBeInTheDocument()
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

  it('/categories 路徑時分類 tab 為 active', () => {
    mockUsePathname.mockReturnValue('/categories')
    render(<BottomNav />)
    const categoriesLink = screen.getByText('分類').closest('a')
    expect(categoriesLink?.style.fontWeight).toBe('600')
  })

  it('/recurring 路徑時定期 tab 為 active', () => {
    mockUsePathname.mockReturnValue('/recurring')
    render(<BottomNav />)
    const recurringLink = screen.getByText('定期').closest('a')
    expect(recurringLink?.style.fontWeight).toBe('600')
  })

  it('連結指向正確的 href', () => {
    render(<BottomNav />)
    expect(screen.getByText('首頁').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('報表').closest('a')).toHaveAttribute('href', '/reports')
    expect(screen.getByText('分類').closest('a')).toHaveAttribute('href', '/categories')
    expect(screen.getByText('定期').closest('a')).toHaveAttribute('href', '/recurring')
  })
})

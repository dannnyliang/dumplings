---
name: new-test
description: 為指定的 React 元件產生 Vitest + React Testing Library 測試檔案，含 Supabase/next/navigation/next/link mock 模板
argument-hint: "[ComponentName]"
---

# /new-test — 產生元件單元測試框架

為 **$ARGUMENTS** 這個元件產生一份完整的 Vitest + React Testing Library 測試檔案。

## 步驟

1. 讀取元件原始碼，找出：
   - 所有 props（名稱、型別、是否必填）
   - 所有可見的 UI 文字（按鈕、標題、placeholder、空狀態）
   - 所有條件渲染邏輯（if/三元）
   - 所有使用者互動（onClick、onSubmit、onChange）
   - 是否使用 `useRouter`、`usePathname`、`next/link`、`createClient`

2. 先提交 **Fact-Forcing Gate**（4 個 facts）後再建立測試檔。

3. 在 `src/__tests__/components/<ComponentName>.test.tsx` 建立測試，套用以下固定模板：

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import <ComponentName> from '@/...'

// ── mock next/navigation（視需要選用） ──
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}))

// ── mock next/link ──
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// ── mock Supabase client ──
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
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

describe('<ComponentName>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 渲染測試
  describe('渲染', () => { ... })

  // 互動測試
  describe('使用者互動', () => { ... })

  // 邊界/空狀態
  describe('空狀態', () => { ... })
})
```

## 測試撰寫原則

- **jsdom 表單驗證**：有 `required` 的欄位，用 `fireEvent.submit(form)` 而非 `userEvent.click(submitBtn)`
- **多元素文字衝突**：recharts/數字/標籤多處重複時，用 `getAllByText(/pattern/).length >= 1`
- **confirm dialog**：`vi.spyOn(window, 'confirm').mockReturnValue(true/false)`
- **非同步斷言**：async handler 用 `await vi.waitFor(() => expect(...))` 或 `await screen.findByText(...)`
- **stopPropagation 驗證**：點擊子按鈕後確認父層 modal 未開啟

## 完成後

跑 `npm test` 確認全 GREEN，再跑 `npm run test:coverage` 確認覆蓋率維持 80%+。

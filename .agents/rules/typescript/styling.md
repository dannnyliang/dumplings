---
paths:
  - "**/*.tsx"
  - "**/*.css"
---
# 樣式

決定與理由見 `docs/adr/0004-tailwind-is-the-only-styling-mechanism.md`。

## Tailwind 是唯一的樣式機制

新程式碼一律使用 Tailwind utility，不要新增 `style={{ ... }}`。

`style={{ ... }}` **只保留給執行期才能決定的值**：依資料計算的寬度百分比、transform 距離、動畫進度。純靜態樣式一律用 class。

```tsx
// WRONG：靜態樣式寫成 inline style
<div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 32, padding: 22 }}>

// WRONG：token 已映射，不需要 arbitrary value
<div className="bg-[var(--dmp-surface)] rounded-[32px]">

// CORRECT
<div className="bg-surface rounded-[2rem] p-[22px] shadow-card">

// CORRECT：執行期計算的值才用 inline style
<div className="bg-accent h-2 rounded-full" style={{ width: `${percent}%` }}>
```

## 可用的 token

`src/app/globals.css` 的 `@theme inline` 已映射全部設計 token：

| Utility | 對應 |
|---|---|
| `bg-surface` / `bg-surface-alt` | 卡片、次要面板 |
| `bg-background` | 頁面底色 |
| `text-text` / `text-soft` / `text-muted` | 主要／次要／輔助文字 |
| `border-line` / `border-line-strong` | 分隔線 |
| `bg-accent` / `bg-accent-soft` / `text-accent-text` | 主色 |
| `text-expense` / `text-expense-strong` | 支出 |
| `text-income` / `bg-income-soft` | 入帳 |
| `shadow-flat` / `shadow-soft` / `shadow-card` | 陰影層級 |
| `font-sans` / `font-mono` | 系統字型堆疊 |

新增 token 時，`:root` 的 `--dmp-*` 與 `@theme inline` 的 `--color-*` **兩處都要加**。

## 既有的 inline style

專案還有約 250 處既有 inline style。**不要為了統一而單獨發起遷移**——它們會在
`openspec/changes/2026-08-09-account-based-ledger/` 改寫各元件時順帶轉換。若你正在
修改某個元件的樣式，順手把該元件轉成 Tailwind；沒動到的部分維持原狀。

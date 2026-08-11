# 樣式一律使用 Tailwind，inline style 只留給動態值

專案同時存在兩套樣式寫法：`className` 出現 29 次，`style={{ ... }}` 出現 252 次，而設計 token 是 `globals.css` 手寫的 `--dmp-*` CSS 變數。Tailwind 4 裝在依賴裡，實質作用僅止於 `@import "tailwindcss"` 一行。兩套並存的代價是每次寫元件都要先決定用哪一種，agent 尤其容易前後不一致。

決定：**Tailwind 是唯一的樣式機制。**

`@theme inline` 補齊了全部設計 token 的映射，因此 `bg-surface`、`text-muted`、`shadow-card`、`border-line` 等 utility 都可直接使用，不需要 `bg-[var(--dmp-surface)]` 這種 arbitrary value。`--dmp-*` 仍是唯一真實來源，`@theme` 只是把它們暴露成 utility。

`style={{ ... }}` 僅保留給執行期才能決定的值——例如依資料計算的寬度百分比、transform 距離、動畫進度。純靜態樣式一律不得使用。

## Consequences

- 新程式碼一律 Tailwind。既有的 252 處 inline style 不另闢工程遷移，而是在 `openspec/changes/2026-08-09-account-based-ledger/` 改寫各元件時順帶轉換——那些元件本來就要重寫，分開做等於改兩次。
- 新增設計 token 時，`:root` 與 `@theme inline` 兩處都要加，否則 Tailwind 側取用不到。這個重複是刻意的：`--dmp-*` 要能被尚未遷移的 inline style 使用。
- token 命名在 Tailwind 側做了調整以避免拗口的 utility：`--dmp-border` → `--color-line`（`border-line`）、`--dmp-text-muted` → `--color-muted`（`text-muted`）、`--dmp-expense-b` → `--color-expense-strong`。
- 未採用「拔掉 Tailwind、只留 CSS 變數」的相反選項：Tailwind 已在依賴中且 Next.js 整合完成，拔除要重寫 layout 骨架，而保留它同時能得到 responsive 前綴與狀態變體，這兩者用 inline style 做不到。

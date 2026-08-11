# 留用 Supabase，但資料寫入改走 Server Actions

重新審視技術選型後決定**不更換 Supabase**，但要把目前由瀏覽器直連資料庫的寫入路徑改為 Server Actions。

不更換的理由是替代方案的成本集中在重做 Google OAuth 與部署，而收益幾乎為零：實際用到的四項能力中，Postgres 換成 Neon 或 Turso 沒有好處，RLS 目前是唯一的授權防線不能拿掉，Realtime 則從未被使用過（全專案沒有任何 `channel()` 或 `subscribe()` 呼叫）。真正的痛點在測試與架構，換資料庫解決不了。

改走 Server Actions 的理由不是安全，而是可測性。目前 `TransactionFormModal`、`TransactionList`、`CategoryManager`、`RecurringManager` 全都 import `@/lib/supabase/client` 直接寫入資料庫，專案內 Server Action 數量為零。這造成三個問題：元件測試只能 mock 掉 supabase，等於驗證「我呼叫了我自己寫的那一行」而非任何真實行為；授權邏輯散落在 RLS policy 裡，看不出應用層意圖；`@supabase/supabase-js` 整包進入 client bundle。

寫入集中到 server 之後，RLS 從唯一防線降為第二道防線——它仍然保留，但應用層有一個看得懂、測得到、改得動的授權入口。

## Consequences

- 元件測試不再 mock Supabase，改為測試 Server Action 的實際行為；現有 `src/__tests__/lib/repos.test.ts` 這類以 `vi.fn()` 斷言「有無呼叫 `from('transactions')`」的測試將失去存在意義，應隨改動移除而非保留。
- `src/lib/repos/*.ts` 接受 `SupabaseClient` 參數的設計維持不變（ADR 0001），Server Action 傳入 server client 即可。
- client bundle 縮小，與既有的效能優化方向一致。
- 免費 tier 專案閒置一段時間後會被暫停，這對「習慣養成」型的 app 是實際風險，需另行確認目前方案的政策與影響。
- 本決定尚未實作。實作順序見 ADR 0003：必須先有測試安全網，才動這個改動。

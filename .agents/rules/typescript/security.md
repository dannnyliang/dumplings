---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.sql"
---
# 安全

## 這個專案的授權模型：RLS 是唯一防線

**所有寫入都從瀏覽器直連 Supabase**（`TransactionFormModal`、`TransactionList`、`CategoryManager`、`RecurringManager` 都 import `@/lib/supabase/client`），專案目前沒有任何 Server Action。

因此 **RLS policy 是唯一擋在資料與外界之間的東西**，不是第二道防線。這帶來三條硬規則：

1. **新資料表一律 `enable row level security` 並建立 policy**，否則等於公開可寫。
2. **policy 一律 `to authenticated`**，不開放 `anon`。本 app 沒有匿名使用情境。
3. **不要為了「方便」而放寬 policy**。household 共享模型下 `using (true)` 是正確的（兩人本來就該看到全部），但那是因為兩人共用一份帳，不是因為圖方便。

改動 RLS 前先讀 `docs/adr/0002`——寫入預計改走 Server Actions，屆時 RLS 會降為第二道防線，但在那之前它是唯一的。

## 金鑰分級

| 值 | 性質 | 可否進 client / 版控 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開，受 RLS 保護 | 可以 |
| 本地 stack 的 demo key（`supabase status` 輸出） | 公開，所有本地環境相同 | 可以 |
| `SERVICE_ROLE_KEY` / `SECRET_KEY` | **繞過 RLS** | **絕對不可**進 client bundle 或正式版控 |

service_role key **只允許出現在 E2E fixture**（`e2e/fixtures/auth.ts`），且只能是本地 stack 的那一把。正式專案的 service_role key 不得寫進任何檔案。

## 環境變數

```typescript
// WRONG
const apiKey = "sk-proj-xxxxx"

// CORRECT
const apiKey = process.env.SOME_API_KEY
if (!apiKey) throw new Error('SOME_API_KEY not configured')
```

`.env.local` 已被 gitignore。**這個 repo 是 public**——任何進版控的檔案都會被公開，`.mcp.json` 曾因此讓一組 token 公開了三個月（見 commit `d169031`）。新增設定檔前先確認裡面沒有憑證。

## 測試環境隔離

E2E **絕不可連向正式 Supabase**。`playwright.config.ts` 以 `webServer.env` 覆寫連線目標，`e2e/environment.spec.ts` 另有執行期斷言攔截任何指向 `supabase.co` 的請求。

新增測試或改動設定時，不要移除那條斷言——它是防止測試資料寫進正式資料庫的最後一道保險。

## 一般檢查

提交前確認：

- 沒有硬編碼的憑證
- 使用者輸入在邊界被驗證
- 錯誤訊息不外洩敏感資訊（`console.error` 的內容只在 server 端）
- 新資料表有 RLS 與 policy
- 沒有把 service_role 相關的東西帶進 client

安全審查可用 `/security-review` 指令，本專案沒有自訂的 security agent。

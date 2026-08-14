# 🥟 Dumplings

夫妻共同記帳 PWA，由 Danny & PeiYu 使用。

**線上版本**：[dumplings-six.vercel.app](https://dumplings-six.vercel.app)

## 功能

- **共同帳戶餘額**：即時計算入帳與支出後的餘額
- **墊付追蹤**：記錄誰先墊付、顯示未還清金額，一鍵標記還清
- **分類管理**：自訂收支分類、停用不需要的項目
- **報表與圖表**：月份切換、支出圓餅圖、備註與分類搜尋
- **定期交易**：設定每月/每週固定項目，一鍵記帳
- **PWA**：可安裝到手機主畫面

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + React 19 |
| 樣式 | Tailwind CSS 4 |
| 圖表 | Recharts 3 |
| 後端 / 資料庫 | Supabase (PostgreSQL + RLS) |
| 認證 | Supabase Auth（Google OAuth） |
| 部署 | Vercel |
| 單元測試 | Vitest + React Testing Library |
| E2E | Playwright（打本地 Supabase） |

## 本地開發

### 環境需求

- Node.js 20+
- **Docker**（本地 Supabase stack 需要）
- Supabase CLI

### 安裝

```bash
git clone https://github.com/dannnyliang/dumplings.git
cd dumplings
npm install
```

### 本地 Supabase

**不需要手動啟動，也不需要讓 Docker 常駐。** `npm run dev`、`npm run e2e`、`npm run types:generate`、`npm run db:reset` 都會先確保它在運行——Docker 沒開就開它（macOS 自動，其他平台會提示），Supabase 沒起就起它。

它是一套完整的 Postgres + Auth + REST（API `54321`、DB `54322`、Studio `54323`），與正式專案完全隔離。**所有開發與測試都應該打這一套，不要連正式專案。**

要手動控制時：

```bash
npm run db:ensure   # 確保運行中（各指令會自己呼叫，通常不必手動跑）
npm run db:stop     # 用完關掉，釋放資源
```

### 環境變數

```bash
cp .env.example .env.local
```

填入 `supabase start` 輸出的本地 URL 與 key：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase status 顯示的 ANON_KEY>
```

### 本地登入（Google OAuth）

登入頁只有「使用 Google 帳號登入」一種方式，本地要能登入需要兩步：

1. Google Cloud Console 的 OAuth client 加入 redirect URI：
   ```
   http://127.0.0.1:54321/auth/v1/callback
   ```
2. 在 shell profile 設定憑證（**不要寫進任何檔案**）：
   ```bash
   export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
   export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
   ```
   設定後重新 `supabase start` 才會生效。

未設定時本地登入不可用，但其餘功能與 E2E 都不受影響——E2E 是用 service_role 建立測試使用者後以帳密取得 session，不經過 OAuth（見 `e2e/fixtures/auth.ts`）。

可用 `curl -s http://127.0.0.1:54321/auth/v1/settings` 確認 `external.google` 是否為 `true`。

### 資料庫 Migration

Migration 由 `supabase start` 自動套用。要從零重放（改動 migration 後必做）：

```bash
npm run db:reset        # 重置資料庫並重啟 Kong
npm run types:generate  # schema 有變就要重新產生型別
```

`db:reset` 一併重啟 Kong 是必要的：`supabase db reset` 只重啟 auth 等容器，Kong 的 upstream 會指向已消失的容器而讓 API 全部回 502。

推到正式環境前請先讀 `.agents/skills/db-migrate/SKILL.md`——本 repo 有 Supabase GitHub integration，migration 由 PR 流程套用。

### 啟動

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 測試

```bash
npm run verify          # 改完必跑：lint + typecheck + types:check + unit + e2e
npm test                # 單元測試
npm run test:watch      # 監看模式
npm run test:coverage   # 覆蓋率報告（verify 不含此項）
npm run e2e             # Playwright E2E
npm run e2e:ui          # Playwright UI 模式
```

`npm test` 通過**不代表** app 能開，只有 `npm run verify` 會因為真實功能壞掉而變紅。它需要本地 Supabase 運行中。

E2E 使用 **3100** port（避開 Next.js 預設的 3000，以免撞到其他專案的 dev server），並在開跑前以 `/manifest.json` 驗明 server 身分。

## 文件

| 路徑 | 內容 |
|------|------|
| `AGENTS.md` | AI agent 的主入口（`CLAUDE.md` 是它的 symlink） |
| `CONTEXT.md` | 領域詞彙與概念邊界 |
| `docs/adr/` | 架構決策紀錄 |
| `openspec/` | 變更提案與規格 |
| `.agents/` | agent 規則、skill、command（工具中立） |

## 專案結構

```
src/
├── app/
│   ├── page.tsx              # 首頁（交易列表 + 餘額）
│   ├── categories/           # 分類管理
│   ├── reports/              # 報表與圖表
│   ├── recurring/            # 定期交易
│   ├── login/                # 登入頁（Google OAuth）
│   └── auth/                 # Auth callback / signout
├── components/               # 呈現與互動，不含領域規則
├── lib/
│   ├── *.ts                  # 領域模組（純函式）：balance、paidBy、month、money、report
│   ├── repos/                # 資料表存取，每張表一個模組
│   └── supabase/             # Supabase client（browser / server）
└── types/
    ├── supabase.ts           # 由 schema 產生，不得手改
    └── database.ts           # 領域型別，自 supabase.ts 衍生
e2e/                          # Playwright 測試與 fixtures
supabase/migrations/          # SQL migration
```

領域規則只能住在 `src/lib/`，元件不得內嵌——ESLint 會擋，理由見 `docs/adr/0001`。

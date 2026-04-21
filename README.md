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
| 認證 | Supabase Auth（Magic Link） |
| 部署 | Vercel |
| 測試 | Vitest + React Testing Library（93 個測試，覆蓋率 80%+） |

## 本地開發

### 環境需求

- Node.js 20+
- Supabase 專案（取得 URL 與 anon key）

### 安裝

```bash
git clone https://github.com/dannnyliang/dumplings.git
cd dumplings
npm install
```

### 環境變數

複製範例檔並填入你的 Supabase 設定：

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 資料庫 Migration

在 Supabase Dashboard → SQL Editor 依序執行：

```
supabase/migrations/20260420000000_init.sql
supabase/migrations/20260420000001_update_categories_rls.sql
supabase/migrations/20260420000002_recurring_transactions.sql
```

### 啟動

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 測試

```bash
npm test                # 執行全部測試
npm run test:watch      # 監看模式
npm run test:coverage   # 產生覆蓋率報告
```

## 專案結構

```
src/
├── app/
│   ├── page.tsx              # 首頁（交易列表 + 餘額）
│   ├── categories/           # 分類管理
│   ├── reports/              # 報表與圖表
│   ├── recurring/            # 定期交易
│   ├── login/                # 登入頁
│   └── auth/                 # Auth callback / signout
├── components/
│   ├── BalanceSummary.tsx    # 餘額摘要 + 墊付提示
│   ├── TransactionList.tsx   # 交易列表（可點擊編輯）
│   ├── TransactionFormModal.tsx  # 新增/編輯/刪除 modal
│   ├── AddTransactionButton.tsx  # FAB 按鈕
│   └── BottomNav.tsx         # 底部導覽列
├── lib/supabase/             # Supabase client（browser / server）
└── types/database.ts         # 型別定義
supabase/migrations/          # SQL migration 檔案
```

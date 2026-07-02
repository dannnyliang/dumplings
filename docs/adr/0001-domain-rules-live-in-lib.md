# 領域規則集中在 src/lib，元件不得內嵌

這個專案早期以 vibe coding 成長，導致最關鍵的領域規則（paid_by 三值契約、代墊/結餘計算、月份契約、金額格式）在元件內重複實作 2–4 次且互相漂移。我們決定：**每條領域規則只有一個家**——純函式領域模組放 `src/lib/`（`paidBy`、`balance`、`report`、`month`、`money`、`tokens`），資料表存取只透過 `src/lib/repos/`（每張表一個模組、select 形狀只有一份、mutation 以意圖命名）；元件與頁面只負責呈現與互動狀態，不得直接下 Supabase 查詢、不得比對 `'shared'`/`'credit_card'` 字面值、不得手刻金額或月份格式。ESLint `no-restricted-syntax` 護欄會擋下違規寫法。

## Consequences

- repo 函式接受 `SupabaseClient` 參數，Server/Client Components 共用同一份查詢形狀；測試 mock `@/lib/supabase/client` 即可穿透。
- 新的衍生概念（如某種彙總）應先在 `src/lib/` 取得具名型別與純函式（先寫測試），元件再消費它。
- 領域詞彙以根目錄 `CONTEXT.md` 為準。

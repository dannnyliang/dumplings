---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Coding Style

架構分層規範（哪些寫法被 ESLint 擋下）見 `AGENTS.md` 與 `docs/adr/0001`。

## 核心原則

**KISS**：能用最簡單的做法解決就別繞路，清楚勝過聰明。
**DRY**：重複出現的邏輯抽成共用函式，但要等重複真的發生，不是預測它會發生。
**YAGNI**：不要為還沒出現的需求建抽象層。先簡單寫，壓力真的來了再重構。

## 檔案組織

寧可多個小檔案，不要少數大檔案。典型 200–400 行，上限 800 行。依領域組織，不要依型別組織（不要 `types/`、`utils/` 這種大雜燴——`src/lib/` 底下每個模組是一個領域概念）。

## 型別

**公開 API 要有明確型別。** exported 函式、共用工具、元件 props 都要標註參數與回傳型別；區域變數讓 TypeScript 自己推斷。

```typescript
// WRONG
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}

// CORRECT
interface User {
  firstName: string
  lastName: string
}

export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

**`interface` 用於可能被擴充的物件形狀，`type` 用於聯集、交集、tuple、mapped type。** 優先用字面值聯集而非 `enum`。

**不要用 `any`。** 外部或不可信的輸入用 `unknown`，再安全收窄。

```typescript
// WRONG
function getErrorMessage(error: any) {
  return error.message
}

// CORRECT
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
```

**元件 props 用具名 interface**，callback 明確標型別，不要用 `React.FC`。

```typescript
interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

**資料表相關的型別不要手寫。** `src/types/database.ts` 從 `src/types/supabase.ts` 衍生，後者由 schema 產生。詳見下方「產生的型別」。

## 不可變性

一律回傳新物件，不要就地修改：

```typescript
// WRONG
function updateUser(user: User, name: string): User {
  user.name = name
  return user
}

// CORRECT
function updateUser(user: Readonly<User>, name: string): User {
  return { ...user, name }
}
```

## 錯誤處理

明確處理，不要無聲吞掉。UI 層給使用者看得懂的訊息，server 端記錄足夠的上下文。

```typescript
async function loadUser(userId: string): Promise<User> {
  try {
    return await riskyOperation(userId)
  } catch (error: unknown) {
    console.error('[loadUser] failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

本專案沒有引入 logging 套件，server 端一律用 `console.error` 並加上來源前綴（例如 `src/app/auth/callback/route.ts` 的 `[auth/callback]`）。

## 輸入驗證

在系統邊界驗證。本專案**沒有安裝 Zod 或任何 schema validation 套件**，資料形狀的保證來自兩處：資料庫端的約束與 RLS，以及 TypeScript 端由 schema 產生的型別。若真的需要 runtime 驗證，先確認是否能改用資料庫約束達成，再考慮引入套件。

## 產生的型別

`src/types/supabase.ts` 由 `npm run types:generate` 從實際 schema 產生，**不得手改**——手改會在 `npm run verify` 的 `types:check` 階段被覆蓋並比對失敗。

要調整領域型別（收窄 union、補 join 欄位）請改 `src/types/database.ts`，它從前者衍生。

## 命名

- 變數與函式：`camelCase`，名稱要能說明用途
- 布林值：用 `is` / `has` / `should` / `can` 開頭
- 型別、介面、元件：`PascalCase`
- 常數：`UPPER_SNAKE_CASE`
- custom hook：`use` 開頭

## 要避開的寫法

**深層巢狀**：超過三、四層就改用 early return。
**魔術數字**：有意義的門檻、延遲、上限都要具名常數。
**過長函式**：超過 50 行就拆成職責清楚的小函式。
**`console.log`**：不要留在程式碼裡。`console.error` 用於 server 端錯誤記錄是可以的。

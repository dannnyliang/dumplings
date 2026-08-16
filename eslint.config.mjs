import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 架構護欄：領域規則只能住在 src/lib（見 docs/adr/0001）。
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='from'][arguments.0.value=/^(transactions|cash_movements|categories|recurring_transactions|profiles)$/]",
          message: "資料表存取請透過 src/lib/repos 的函式，元件內不要直接下 Supabase 查詢。",
        },
        {
          selector:
            "BinaryExpression[right.value='shared'], BinaryExpression[right.value='joint_card'], BinaryExpression[left.value='shared'], BinaryExpression[left.value='joint_card']",
          message: "payment_method 判讀請使用 @/lib/paymentMethod 的 helpers（isPaidFromSharedAccount 等），不要比對字面值。",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message: "金額顯示請使用 @/lib/money 的 formatMoney / formatSignedMoney。",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright 產物：report 內嵌壓縮過的 bundle，lint 它毫無意義且會淹沒真實錯誤。
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
  ]),
]);

export default eslintConfig;

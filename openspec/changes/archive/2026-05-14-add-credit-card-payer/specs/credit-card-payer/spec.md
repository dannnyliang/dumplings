## ADDED Requirements

### Requirement: 交易可指定信用卡為代墊方
系統 SHALL 在 `TransactionFormModal` 的代墊方選項中加入固定的「信用卡」選項，選擇後 `paid_by` 儲存為 `'credit_card'`。

#### Scenario: 選擇信用卡建立交易
- **WHEN** 使用者在新增/編輯交易時，從代墊方選單選擇「信用卡」並送出
- **THEN** 交易建立成功，`paid_by = 'credit_card'`，交易列表顯示「信用卡」標籤

#### Scenario: 信用卡選項僅在 expense 類型顯示
- **WHEN** 使用者建立 `topup` 類型交易
- **THEN** 代墊方選單不顯示「信用卡」選項

### Requirement: 交易列表顯示信用卡標籤
系統 SHALL 在 `TransactionList` 中，對 `paid_by = 'credit_card'` 的交易顯示「信用卡」標籤。

#### Scenario: 信用卡代墊交易顯示標籤
- **WHEN** 使用者查看交易列表，其中有一筆信用卡代墊交易
- **THEN** 該筆交易顯示「信用卡」作為代墊方標籤，而非使用者名稱

### Requirement: BalanceSummary 顯示信用卡未還款金額
系統 SHALL 在 `BalanceSummary` 中計算並顯示 `paid_by = 'credit_card'` 且 `is_reimbursed = false` 的交易總額。

#### Scenario: 存在信用卡未還款交易
- **WHEN** 有 `paid_by = 'credit_card'` 且 `is_reimbursed = false` 的交易
- **THEN** BalanceSummary 顯示「信用卡未還款」金額

#### Scenario: 所有信用卡交易已還款
- **WHEN** 所有信用卡代墊交易均已標記 `is_reimbursed = true`
- **THEN** BalanceSummary 不顯示信用卡未還款區塊（金額為 0 時隱藏）

### Requirement: `paid_by` 型別安全解析
系統 SHALL 提供 helper functions 在 TypeScript 層安全識別 `paid_by` 的三種值：user UUID、`'shared'`、`'credit_card'`。

#### Scenario: 識別信用卡格式
- **WHEN** `paid_by = 'credit_card'`
- **THEN** `isPaidByCreditCard(paid_by)` 回傳 `true`，其他 type guards 回傳 `false`

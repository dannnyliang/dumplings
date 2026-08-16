/**
 * `payment_method` 三值契約（'shared' | 'joint_card' | user UUID）的唯一解讀點。
 * 元件不得直接比對 'shared' / 'joint_card' 字面值，一律經過這裡。
 *
 * 三種付款方式的差別只在共同帳戶的現金流出時點：
 * 共同帳戶＝消費日、共同卡＝帳單扣款日、某人墊付＝結算日（見 CONTEXT.md）。
 */

export const PAYMENT_METHOD_SHARED = 'shared' as const
export const PAYMENT_METHOD_JOINT_CARD = 'joint_card' as const

const SHARED_LABEL = '共同帳戶'
const JOINT_CARD_LABEL = '共同卡'
const UNKNOWN_USER_LABEL = '某人'

/** 消費日即自共同帳戶扣款。 */
export function isPaidFromSharedAccount(paymentMethod: string): boolean {
  return paymentMethod === PAYMENT_METHOD_SHARED
}

/** 記入共同卡未出帳，帳單扣款日才有現金流出。 */
export function isPaidByJointCard(paymentMethod: string): boolean {
  return paymentMethod === PAYMENT_METHOD_JOINT_CARD
}

/** 某人先墊付（值為 user UUID），結算日才有現金流出。 */
export function isUserAdvance(paymentMethod: string): boolean {
  return !isPaidFromSharedAccount(paymentMethod) && !isPaidByJointCard(paymentMethod)
}

/** 付款方式顯示名稱：共同帳戶 / 共同卡 / 使用者名稱（查無則「某人」）。 */
export function paymentMethodLabel(
  paymentMethod: string,
  profiles: Record<string, string>
): string {
  if (isPaidFromSharedAccount(paymentMethod)) return SHARED_LABEL
  if (isPaidByJointCard(paymentMethod)) return JOINT_CARD_LABEL
  return profiles[paymentMethod] ?? UNKNOWN_USER_LABEL
}

/**
 * 表單選項。新增時固定三個：共同帳戶、共同卡、記錄者本人；
 * 編輯他人墊付的紀錄時，該使用者附加於選項尾端。
 */
export function paymentMethodOptions(userId: string, editingMethod?: string): string[] {
  const options = [PAYMENT_METHOD_SHARED, PAYMENT_METHOD_JOINT_CARD, userId]
  if (editingMethod && !options.includes(editingMethod)) options.push(editingMethod)
  return options
}

/** 表單按鈕文字：記錄者本人顯示「我墊的」，另一位使用者顯示「{名稱} 墊的」。 */
export function paymentMethodOptionLabel(
  option: string,
  userId: string,
  profiles: Record<string, string>
): string {
  if (!isUserAdvance(option)) return paymentMethodLabel(option, profiles)
  if (option === userId) return '我墊的'
  return `${paymentMethodLabel(option, profiles)} 墊的`
}

/**
 * 定期模板仍以舊 `paid_by` 值儲存（'shared' | 'credit_card' | user UUID），
 * 產生交易時經此轉換為付款方式。模板改版（金額固定／浮動）時一併汰換。
 */
export function paymentMethodFromLegacyPaidBy(paidBy: string): string {
  return paidBy === 'credit_card' ? PAYMENT_METHOD_JOINT_CARD : paidBy
}

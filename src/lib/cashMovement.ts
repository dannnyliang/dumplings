import type { CashMovement, CashMovementKind } from '@/types/database'
import type { MoneyFlow } from '@/lib/money'

/**
 * 現金移動（入帳／共同卡帳單扣款／結算給某人）的唯一解讀點。
 * 現金移動的日期是共同帳戶餘額變動的唯一時間依據（見 CONTEXT.md）。
 */

const KIND_LABELS: Record<CashMovementKind, string> = {
  topup: '入帳',
  card_bill: '共同卡帳單扣款',
  settlement: '結算',
}

/** 顯示名稱；結算帶對象名稱（查無則「某人」）。 */
export function cashMovementLabel(
  movement: Pick<CashMovement, 'kind' | 'counterparty'>,
  profiles: Record<string, string>
): string {
  if (movement.kind !== 'settlement') return KIND_LABELS[movement.kind]
  const name = movement.counterparty ? (profiles[movement.counterparty] ?? '某人') : '某人'
  return `結算給 ${name}`
}

/** 對共同帳戶而言的資金方向：入帳是流入，其餘是流出。 */
export function cashMovementDirection(kind: CashMovementKind): MoneyFlow {
  return kind === 'topup' ? 'in' : 'out'
}

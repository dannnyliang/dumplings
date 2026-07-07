/**
 * 換頁方向的唯一判斷點。
 *
 * View Transitions 的 React <ViewTransition> 需要 experimental React runtime，
 * 為避免動搖 runtime，改由 app/template.tsx 以 CSS 進場動畫呈現方向性滑動。
 * BottomNav 導航前 setNavDirection()，template 掛載時 consumeNavDirection() 取用一次。
 */

export type NavDirection = 'forward' | 'back' | 'none'

/**
 * 依導覽順序判斷方向：目標在來源右側為 forward，左側為 back。
 * 任一端不在導覽清單（如直接開網址、瀏覽器上一頁）則回 none（中性淡入）。
 */
export function directionBetween(order: readonly string[], from: string, to: string): NavDirection {
  const fromIndex = order.indexOf(from)
  const toIndex = order.indexOf(to)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return 'none'
  return toIndex > fromIndex ? 'forward' : 'back'
}

let pending: NavDirection = 'none'

export function setNavDirection(direction: NavDirection): void {
  pending = direction
}

/** 取用後即歸零，讓 refresh／瀏覽器上一頁等未明確標記的導航回到中性淡入。 */
export function consumeNavDirection(): NavDirection {
  const direction = pending
  pending = 'none'
  return direction
}

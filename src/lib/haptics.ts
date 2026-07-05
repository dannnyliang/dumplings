/**
 * 觸覺回饋的唯一入口。navigator.vibrate 在桌機/不支援的裝置上不存在，
 * 一律 no-op，呼叫端不需自行判斷環境。
 */

const DEFAULT_PATTERN = 8

export function tryHaptic(pattern: number | number[] = DEFAULT_PATTERN): void {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

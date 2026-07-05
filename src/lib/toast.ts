/**
 * 輕量 toast 事件匯流排：發訊者不需拿到 React context，
 * 沿用專案既有的 window CustomEvent 慣例（見 dmp:open-add）。
 * 由掛在 layout 的 ToastHost 監聽並呈現。
 */

export type ToastTone = 'success' | 'error'

export interface ToastPayload {
  message: string
  tone: ToastTone
}

export const TOAST_EVENT = 'dmp:toast'

export function showToast(message: string, tone: ToastTone = 'success'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: { message, tone } }))
}

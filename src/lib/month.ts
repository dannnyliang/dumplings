/**
 * 日期與月份契約的唯一實作。
 *
 * 全專案的「月份」一律是本地時區的 'YYYY-MM' 字串，「日期」是 'YYYY-MM-DD'。
 * 一律使用本地時區（而非 toISOString 的 UTC），避免台灣清晨記帳落在前一天。
 */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 以本地時區將 Date 轉為 'YYYY-MM-DD'。 */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 今天的本地日期字串。 */
export function todayISO(): string {
  return toISODate(new Date())
}

/** 本月的 'YYYY-MM'。 */
export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

/** 一個月份的起訖日期（含），供查詢邊界使用。 */
export function monthRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number)
  const lastDay = new Date(year, mon, 0).getDate()
  return {
    start: `${year}-${pad(mon)}-01`,
    end: `${year}-${pad(mon)}-${pad(lastDay)}`,
  }
}

/** 月份加減（delta 可為負），自動跨年。 */
export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** 'YYYY-MM' → '2026 年 4 月'。 */
export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-')
  return `${year} 年 ${Number(mon)} 月`
}

/** 'YYYY-MM-DD' → 'M/D'（列表分組標頭用）。 */
export function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** 連續 n 天的本地日期字串，遞增排序、以今天結尾。 */
export function lastNDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (n - 1) + i)
    return toISODate(d)
  })
}

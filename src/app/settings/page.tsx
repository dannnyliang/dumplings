import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/supabase/auth'
import Icon from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'

/**
 * 設定頁：收納低頻的維護動作（design D7——分類與定期都是設好就不動的
 * 維護動作，不值得各佔一個主導覽位置）。共同卡刻意沒有可設定的東西
 * （不建模帳單週期，見 docs/adr/0005）。
 */

const SETTING_LINKS: Array<{ href: string; label: string; description: string; icon: IconName }> = [
  { href: '/categories', label: '分類管理', description: '新增或停用消費分類', icon: 'tag' },
  { href: '/recurring', label: '定期支出', description: '管理每月／每週固定的帳', icon: 'repeat' },
]

export default async function SettingsPage() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) redirect('/login')

  return (
    <main className="bg-background min-h-dvh pb-[100px]">
      <header className="bg-background border-line sticky top-0 z-10 flex items-center gap-2 border-b px-5 py-3">
        <Link href="/" aria-label="回首頁" className="text-muted flex">
          <Icon name="back" size={22} />
        </Link>
        <h1 className="text-text m-0 flex-1 text-xl font-bold">設定</h1>
      </header>

      <div className="mx-auto flex max-w-[480px] flex-col gap-4 px-5 py-4">
        <div className="bg-surface shadow-soft overflow-hidden rounded-[20px]">
          <ul className="m-0 list-none p-0">
            {SETTING_LINKS.map((item, idx) => (
              <li key={item.href} className={idx > 0 ? 'border-line border-t' : ''}>
                <Link href={item.href} className="flex items-center gap-3 px-4 py-3.5 no-underline">
                  <span className="text-muted flex">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-text block text-[14px] font-medium">{item.label}</span>
                    <span className="text-muted mt-0.5 block text-[12px]">{item.description}</span>
                  </span>
                  <span className="text-muted flex">
                    <Icon name="chevR" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="bg-surface shadow-soft text-expense w-full cursor-pointer rounded-[20px] border-none px-4 py-3.5 text-[14px] font-medium"
          >
            登出
          </button>
        </form>
      </div>
    </main>
  )
}

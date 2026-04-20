'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/reports', label: '報表', icon: '📊' },
  { href: '/categories', label: '分類', icon: '🏷️' },
  { href: '/recurring', label: '定期', icon: '🔄' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition ${
                isActive ? 'text-indigo-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

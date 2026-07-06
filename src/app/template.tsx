'use client'

import { useState } from 'react'
import { consumeNavDirection } from '@/lib/navDirection'

const ENTER_CLASS = {
  forward: 'dmp-page-enter-forward',
  back: 'dmp-page-enter-back',
  none: 'dmp-page-enter',
} as const

/**
 * App Router template：每次導航都重新掛載，藉此播放頁面進場動畫。
 * 方向由 BottomNav 於導航前 setNavDirection() 標記，這裡以 useState 初始化取用一次
 * （template 每次導航重新掛載，故每次導航只消費一次；refresh 不算導航，不會重播）。
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [direction] = useState(consumeNavDirection)
  return <div className={ENTER_CLASS[direction]}>{children}</div>
}

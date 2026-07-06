'use client'

import { useEffect } from 'react'

/**
 * 註冊 /sw.js（僅 production；dev 下 SW 快取會干擾 HMR）。
 * SW 只快取靜態資源、不碰 Supabase 與導航，故不影響 read-your-own-writes。
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* 註冊失敗不影響 app 運作 */
      })
    }

    // 等頁面載入完成再註冊，避免與首屏資源競爭頻寬。
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}

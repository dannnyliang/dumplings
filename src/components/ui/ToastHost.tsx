'use client'

import { useEffect, useRef, useState } from 'react'
import { TOAST_EVENT, type ToastPayload, type ToastTone } from '@/lib/toast'

interface ToastItem extends ToastPayload {
  id: number
}

const TOAST_DURATION = 2600

const TONE_STYLES: Record<ToastTone, { bg: string; color: string; icon: string }> = {
  success: { bg: 'var(--dmp-text)', color: 'var(--dmp-bg)', icon: '✓' },
  error: { bg: '#B83B3B', color: '#FFFFFF', icon: '!' },
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    function handle(event: Event) {
      const { message, tone } = (event as CustomEvent<ToastPayload>).detail
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, tone }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, TOAST_DURATION)
    }

    window.addEventListener(TOAST_EVENT, handle)
    return () => window.removeEventListener(TOAST_EVENT, handle)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const tone = TONE_STYLES[toast.tone]
        return (
          <div
            key={toast.id}
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: 'min(440px, calc(100vw - 40px))',
              padding: '10px 16px',
              borderRadius: 999,
              backgroundColor: tone.bg,
              color: tone.color,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(30,20,12,0.22)',
              animation: 'dmp-toast-in 0.24s cubic-bezier(0.3,0.7,0.3,1)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 13, opacity: 0.9 }}>{tone.icon}</span>
            {toast.message}
          </div>
        )
      })}
    </div>
  )
}

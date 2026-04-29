'use client'

import { useEffect, useState } from 'react'
import TransactionFormModal from './TransactionFormModal'

interface AddTransactionButtonProps {
  userId: string
}

export default function AddTransactionButton({ userId }: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('dmp:open-add', handler)
    return () => window.removeEventListener('dmp:open-add', handler)
  }, [])

  if (!isOpen) return null

  return (
    <TransactionFormModal userId={userId} onClose={() => setIsOpen(false)} />
  )
}

'use client'

import { useEffect, useState } from 'react'
import TransactionFormModal from './TransactionFormModal'
import type { Category } from '@/types/database'

interface AddTransactionButtonProps {
  userId: string
  categories?: Category[]
}

export default function AddTransactionButton({ userId, categories }: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('dmp:open-add', handler)
    return () => window.removeEventListener('dmp:open-add', handler)
  }, [])

  if (!isOpen) return null

  return (
    <TransactionFormModal userId={userId} categories={categories} onClose={() => setIsOpen(false)} />
  )
}

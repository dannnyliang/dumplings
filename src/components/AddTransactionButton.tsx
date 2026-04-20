'use client'

import { useState } from 'react'
import TransactionFormModal from './TransactionFormModal'

interface AddTransactionButtonProps {
  userId: string
}

export default function AddTransactionButton({ userId }: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition active:scale-95 z-20"
        aria-label="新增記帳"
      >
        +
      </button>
      {isOpen && (
        <TransactionFormModal userId={userId} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}

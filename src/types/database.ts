export type TransactionType = 'expense' | 'topup'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  created_by: string | null
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category_id: string | null
  date: string
  note: string | null
  paid_by: string
  is_reimbursed: boolean
  reimbursed_at: string | null
  created_by: string | null
  created_at: string
  category?: Category
  creator?: Profile
}

export interface NewTransaction {
  amount: number
  type: TransactionType
  category_id: string | null
  date: string
  note: string | null
  paid_by: string
}

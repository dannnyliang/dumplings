import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CashMovementFormModal from '@/components/CashMovementFormModal'
import type { CashMovement } from '@/types/database'

const mockInsert = vi.fn(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}))
const mockDelete = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}))
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

vi.mock('@/components/TransactionsMutationContext', () => ({
  useLedgerMutators: () => ({
    mutateTransaction: (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
    mutateCashMovement: (_optimistic: unknown, commit: () => Promise<{ error: unknown }>) => {
      void commit()
    },
  }),
}))

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

const EXISTING_TOPUP: CashMovement = {
  id: 'm1',
  amount: 5000,
  date: '2026-04-01',
  kind: 'topup',
  counterparty: null,
  note: null,
  created_by: 'uid-danny',
  created_at: '2026-04-01T00:00:00Z',
}

describe('CashMovementFormModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('結算給某人', () => {
    it('標題帶對象名稱', () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movementKind: 'settlement', counterparty: 'uid-peiyu', defaultAmount: 2500 }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      expect(screen.getByText('結算給 PeiYu')).toBeInTheDocument()
    })

    it('金額預設帶入對象的待還總額', () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movementKind: 'settlement', counterparty: 'uid-peiyu', defaultAmount: 2500 }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      expect((screen.getByPlaceholderText('0') as HTMLInputElement).value).toBe('2500')
    })

    it('可改為部分金額後送出，寫入結算紀錄', async () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movementKind: 'settlement', counterparty: 'uid-peiyu', defaultAmount: 20000 }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '15000' } })
      fireEvent.click(screen.getByText('新增記錄'))
      expect(mockFrom).toHaveBeenCalledWith('cash_movements')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 15000,
          kind: 'settlement',
          counterparty: 'uid-peiyu',
          created_by: 'uid-danny',
        })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('共同卡帳單扣款', () => {
    function renderCardBill(currentUnbilled: number) {
      return render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movementKind: 'card_bill' }}
          currentUnbilled={currentUnbilled}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
    }

    it('輸入金額與累計未出帳不符時顯示差額提示', () => {
      renderCardBill(23200)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '23450' } })
      expect(screen.getByText(/相差 NT\$ 250/)).toBeInTheDocument()
      expect(screen.getByText(/可能有消費未記錄/)).toBeInTheDocument()
    })

    it('金額相符時不顯示提示', () => {
      renderCardBill(23200)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '23200' } })
      expect(screen.queryByText(/相差/)).not.toBeInTheDocument()
    })

    it('送出後寫入帳單扣款紀錄', () => {
      renderCardBill(23200)
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '23450' } })
      fireEvent.click(screen.getByText('新增記錄'))
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 23450, kind: 'card_bill', counterparty: null })
      )
    })
  })

  describe('編輯既有現金移動', () => {
    it('預填金額與日期', () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movement: EXISTING_TOPUP }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      expect((screen.getByPlaceholderText('0') as HTMLInputElement).value).toBe('5000')
      expect(screen.getByDisplayValue('2026-04-01')).toBeInTheDocument()
    })

    it('儲存變更走 update', () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movement: EXISTING_TOPUP }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '6000' } })
      fireEvent.click(screen.getByText('儲存變更'))
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ amount: 6000 }))
    })

    it('刪除需經確認，確認後走 delete', async () => {
      const user = userEvent.setup()
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movement: EXISTING_TOPUP }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      await user.click(screen.getByText('刪除這筆記錄'))
      await user.click(screen.getByText('確認刪除'))
      expect(mockDelete).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('表單驗證', () => {
    it('金額為空時 CTA 為 disabled', () => {
      render(
        <CashMovementFormModal
          userId="uid-danny"
          draft={{ movementKind: 'card_bill' }}
          profiles={PROFILES}
          onClose={onClose}
        />
      )
      expect(screen.getByText('新增記錄')).toBeDisabled()
    })
  })
})

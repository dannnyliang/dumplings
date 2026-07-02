import { describe, it, expect } from 'vitest'
import {
  isPaidByShared,
  isPaidByCreditCard,
  isPaidByUser,
  paidByFromForm,
  paidByForTransaction,
  formKindFromPaidBy,
  payerLabel,
  PAID_BY_SHARED,
  PAID_BY_CREDIT_CARD,
} from '@/lib/paidBy'

describe('paidBy helpers', () => {
  describe('isPaidByShared', () => {
    it('returns true for "shared"', () => {
      expect(isPaidByShared(PAID_BY_SHARED)).toBe(true)
    })

    it('returns false for credit_card', () => {
      expect(isPaidByShared(PAID_BY_CREDIT_CARD)).toBe(false)
    })

    it('returns false for user UUID', () => {
      expect(isPaidByShared('uid-danny')).toBe(false)
    })
  })

  describe('isPaidByCreditCard', () => {
    it('returns true for "credit_card"', () => {
      expect(isPaidByCreditCard(PAID_BY_CREDIT_CARD)).toBe(true)
    })

    it('returns false for "shared"', () => {
      expect(isPaidByCreditCard(PAID_BY_SHARED)).toBe(false)
    })

    it('returns false for user UUID', () => {
      expect(isPaidByCreditCard('uid-danny')).toBe(false)
    })
  })

  describe('isPaidByUser', () => {
    it('returns true for user UUID', () => {
      expect(isPaidByUser('uid-danny')).toBe(true)
    })

    it('returns false for "shared"', () => {
      expect(isPaidByUser(PAID_BY_SHARED)).toBe(false)
    })

    it('returns false for "credit_card"', () => {
      expect(isPaidByUser(PAID_BY_CREDIT_CARD)).toBe(false)
    })
  })

  describe('paidByFromForm', () => {
    it('maps "self" to the user id', () => {
      expect(paidByFromForm('self', 'uid-danny')).toBe('uid-danny')
    })

    it('maps "credit_card" to the credit-card sentinel', () => {
      expect(paidByFromForm('credit_card', 'uid-danny')).toBe(PAID_BY_CREDIT_CARD)
    })

    it('maps "shared" to the shared sentinel', () => {
      expect(paidByFromForm('shared', 'uid-danny')).toBe(PAID_BY_SHARED)
    })
  })

  describe('paidByForTransaction', () => {
    it('uses the form mapping for expenses', () => {
      expect(paidByForTransaction('expense', 'self', 'uid-danny')).toBe('uid-danny')
      expect(paidByForTransaction('expense', 'credit_card', 'uid-danny')).toBe(PAID_BY_CREDIT_CARD)
    })

    it('always stores topups as shared', () => {
      expect(paidByForTransaction('topup', 'self', 'uid-danny')).toBe(PAID_BY_SHARED)
      expect(paidByForTransaction('topup', 'credit_card', 'uid-danny')).toBe(PAID_BY_SHARED)
    })
  })

  describe('formKindFromPaidBy', () => {
    it('maps the shared sentinel to "shared"', () => {
      expect(formKindFromPaidBy(PAID_BY_SHARED)).toBe('shared')
    })

    it('maps the credit-card sentinel to "credit_card"', () => {
      expect(formKindFromPaidBy(PAID_BY_CREDIT_CARD)).toBe('credit_card')
    })

    it('maps a user UUID to "self"', () => {
      expect(formKindFromPaidBy('uid-danny')).toBe('self')
    })

    it('round-trips with paidByFromForm', () => {
      for (const kind of ['shared', 'self', 'credit_card'] as const) {
        expect(formKindFromPaidBy(paidByFromForm(kind, 'uid-danny'))).toBe(kind)
      }
    })
  })

  describe('payerLabel', () => {
    const profiles = { 'uid-danny': 'Danny' }

    it('labels the credit card 信用卡', () => {
      expect(payerLabel(PAID_BY_CREDIT_CARD, profiles)).toBe('信用卡')
    })

    it('labels the shared account 共同帳戶', () => {
      expect(payerLabel(PAID_BY_SHARED, profiles)).toBe('共同帳戶')
    })

    it('labels a known user with their display name', () => {
      expect(payerLabel('uid-danny', profiles)).toBe('Danny')
    })

    it('falls back to 某人 for an unknown user', () => {
      expect(payerLabel('uid-unknown', profiles)).toBe('某人')
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  isPaidByShared,
  isPaidByCreditCard,
  isPaidByUser,
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
})

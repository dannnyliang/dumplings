import { describe, it, expect } from 'vitest'
import {
  PAYMENT_METHOD_JOINT_CARD,
  PAYMENT_METHOD_SHARED,
  isPaidByJointCard,
  isPaidFromSharedAccount,
  isUserAdvance,
  paymentMethodFromLegacyPaidBy,
  paymentMethodLabel,
  paymentMethodOptionLabel,
  paymentMethodOptions,
} from '@/lib/paymentMethod'

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

describe('付款方式判讀', () => {
  it('共同帳戶只在值為 shared 時成立', () => {
    expect(isPaidFromSharedAccount(PAYMENT_METHOD_SHARED)).toBe(true)
    expect(isPaidFromSharedAccount(PAYMENT_METHOD_JOINT_CARD)).toBe(false)
    expect(isPaidFromSharedAccount('uid-danny')).toBe(false)
  })

  it('共同卡只在值為 joint_card 時成立', () => {
    expect(isPaidByJointCard(PAYMENT_METHOD_JOINT_CARD)).toBe(true)
    expect(isPaidByJointCard(PAYMENT_METHOD_SHARED)).toBe(false)
    expect(isPaidByJointCard('uid-danny')).toBe(false)
  })

  it('非 shared 亦非 joint_card 的值視為某人墊付', () => {
    expect(isUserAdvance('uid-danny')).toBe(true)
    expect(isUserAdvance(PAYMENT_METHOD_SHARED)).toBe(false)
    expect(isUserAdvance(PAYMENT_METHOD_JOINT_CARD)).toBe(false)
  })
})

describe('paymentMethodLabel', () => {
  it('共同帳戶與共同卡有固定名稱', () => {
    expect(paymentMethodLabel(PAYMENT_METHOD_SHARED, PROFILES)).toBe('共同帳戶')
    expect(paymentMethodLabel(PAYMENT_METHOD_JOINT_CARD, PROFILES)).toBe('共同卡')
  })

  it('墊付者顯示其名稱，查無則顯示某人', () => {
    expect(paymentMethodLabel('uid-peiyu', PROFILES)).toBe('PeiYu')
    expect(paymentMethodLabel('uid-unknown', PROFILES)).toBe('某人')
  })
})

describe('paymentMethodOptions（表單選項）', () => {
  it('新增時只有共同帳戶、共同卡、記錄者本人三個選項', () => {
    expect(paymentMethodOptions('uid-danny')).toEqual([
      PAYMENT_METHOD_SHARED,
      PAYMENT_METHOD_JOINT_CARD,
      'uid-danny',
    ])
  })

  it('編輯他人墊付的紀錄時，該使用者出現在選項中', () => {
    expect(paymentMethodOptions('uid-danny', 'uid-peiyu')).toEqual([
      PAYMENT_METHOD_SHARED,
      PAYMENT_METHOD_JOINT_CARD,
      'uid-danny',
      'uid-peiyu',
    ])
  })

  it('編輯自己或共同付款方式的紀錄不會產生重複選項', () => {
    expect(paymentMethodOptions('uid-danny', 'uid-danny')).toHaveLength(3)
    expect(paymentMethodOptions('uid-danny', PAYMENT_METHOD_SHARED)).toHaveLength(3)
  })
})

describe('paymentMethodOptionLabel（表單按鈕文字）', () => {
  it('記錄者本人顯示為我墊的', () => {
    expect(paymentMethodOptionLabel('uid-danny', 'uid-danny', PROFILES)).toBe('我墊的')
  })

  it('另一位使用者顯示其名稱加「墊的」', () => {
    expect(paymentMethodOptionLabel('uid-peiyu', 'uid-danny', PROFILES)).toBe('PeiYu 墊的')
  })

  it('共同付款方式沿用固定名稱', () => {
    expect(paymentMethodOptionLabel(PAYMENT_METHOD_SHARED, 'uid-danny', PROFILES)).toBe('共同帳戶')
    expect(paymentMethodOptionLabel(PAYMENT_METHOD_JOINT_CARD, 'uid-danny', PROFILES)).toBe('共同卡')
  })
})

describe('paymentMethodFromLegacyPaidBy（定期模板的舊值轉換）', () => {
  it('credit_card 轉為共同卡', () => {
    expect(paymentMethodFromLegacyPaidBy('credit_card')).toBe(PAYMENT_METHOD_JOINT_CARD)
  })

  it('shared 與 user UUID 原樣保留', () => {
    expect(paymentMethodFromLegacyPaidBy('shared')).toBe(PAYMENT_METHOD_SHARED)
    expect(paymentMethodFromLegacyPaidBy('uid-danny')).toBe('uid-danny')
  })
})

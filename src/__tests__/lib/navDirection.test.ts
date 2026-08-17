import { describe, it, expect, beforeEach } from 'vitest'
import {
  directionBetween,
  setNavDirection,
  consumeNavDirection,
} from '@/lib/navDirection'

// 與 BottomNav 的 NAV_ORDER 一致：主導覽只剩首頁與報表兩頁
const ORDER = ['/', '/reports']

describe('directionBetween', () => {
  it('往導覽順序右側移動回 forward', () => {
    expect(directionBetween(ORDER, '/', '/reports')).toBe('forward')
  })

  it('往導覽順序左側移動回 back', () => {
    expect(directionBetween(ORDER, '/reports', '/')).toBe('back')
  })

  it('來源或目標不在清單時回 none（設定、分類、定期一律中性淡入）', () => {
    expect(directionBetween(ORDER, '/login', '/')).toBe('none')
    expect(directionBetween(ORDER, '/', '/settings')).toBe('none')
    expect(directionBetween(ORDER, '/categories', '/reports')).toBe('none')
  })

  it('同一頁回 none', () => {
    expect(directionBetween(ORDER, '/reports', '/reports')).toBe('none')
  })
})

describe('setNavDirection / consumeNavDirection', () => {
  beforeEach(() => {
    consumeNavDirection() // 清空殘留
  })

  it('取用後回傳先前設定的方向', () => {
    setNavDirection('forward')
    expect(consumeNavDirection()).toBe('forward')
  })

  it('取用後即歸零為 none', () => {
    setNavDirection('back')
    consumeNavDirection()
    expect(consumeNavDirection()).toBe('none')
  })

  it('未設定時預設為 none', () => {
    expect(consumeNavDirection()).toBe('none')
  })
})

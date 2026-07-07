import { describe, it, expect, beforeEach } from 'vitest'
import {
  directionBetween,
  setNavDirection,
  consumeNavDirection,
} from '@/lib/navDirection'

const ORDER = ['/', '/reports', '/categories', '/recurring']

describe('directionBetween', () => {
  it('往導覽順序右側移動回 forward', () => {
    expect(directionBetween(ORDER, '/', '/reports')).toBe('forward')
    expect(directionBetween(ORDER, '/reports', '/recurring')).toBe('forward')
  })

  it('往導覽順序左側移動回 back', () => {
    expect(directionBetween(ORDER, '/recurring', '/')).toBe('back')
    expect(directionBetween(ORDER, '/categories', '/reports')).toBe('back')
  })

  it('來源或目標不在清單時回 none', () => {
    expect(directionBetween(ORDER, '/login', '/')).toBe('none')
    expect(directionBetween(ORDER, '/', '/unknown')).toBe('none')
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

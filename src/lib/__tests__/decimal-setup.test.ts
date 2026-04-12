import { describe, it, expect } from 'vitest'
import { Decimal, toDecimal, toDbNumeric } from '@/lib/decimal-setup'

describe('decimal-setup', () => {
  it('should create a Decimal instance with correct precision', () => {
    const amount = new Decimal('150000.50')
    expect(amount.toString()).toBe('150000.5')
  })

  it('should use ROUND_HALF_UP for financial rounding', () => {
    const value = new Decimal('100.005')
    expect(value.toFixed(2)).toBe('100.01')
  })

  it('should perform arithmetic without floating-point errors', () => {
    // Classic JS: 0.1 + 0.2 = 0.30000000000000004
    const result = new Decimal('0.1').plus('0.2')
    expect(result.toString()).toBe('0.3')
  })

  it('toDecimal handles null/undefined gracefully', () => {
    expect(toDecimal(null).toString()).toBe('0')
    expect(toDecimal(undefined).toString()).toBe('0')
    expect(toDecimal('').toString()).toBe('0')
  })

  it('toDecimal parses string and number values', () => {
    expect(toDecimal('450000').toString()).toBe('450000')
    expect(toDecimal(450000).toString()).toBe('450000')
  })

  it('toDbNumeric formats to 2 decimal places', () => {
    const amount = new Decimal('150000')
    expect(toDbNumeric(amount)).toBe('150000.00')
  })
})

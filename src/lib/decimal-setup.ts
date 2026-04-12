/**
 * decimal.js Global Configuration for EDARA Financial Calculations
 *
 * ADR-07: All monetary operations MUST use Decimal, never native JS Number.
 * This module configures Decimal.js with consistent precision settings
 * and exports a pre-configured Decimal constructor for use throughout
 * the application.
 *
 * Usage:
 *   import { Decimal } from '@/lib/decimal-setup'
 *   const amount = new Decimal('150000.00')
 *   const result = amount.minus('50000').times('1.1')
 */

import _Decimal from 'decimal.js'

// Configure global defaults for financial precision
_Decimal.set({
  // 20 significant digits — more than enough for IDR amounts up to
  // quadrillions while preserving 2 decimal places
  precision: 20,

  // ROUND_HALF_UP (standard financial rounding: 0.5 → 1)
  rounding: _Decimal.ROUND_HALF_UP,

  // Minimum exponent for very small numbers (unlikely in financial context)
  minE: -9,

  // Maximum exponent — prevents absurdly large numbers
  maxE: 18,

  // Convert to exponential notation only beyond this threshold
  toExpNeg: -7,
  toExpPos: 21,
})

/**
 * Pre-configured Decimal constructor.
 * Always import from this module instead of 'decimal.js' directly
 * to ensure consistent global settings.
 */
export const Decimal = _Decimal

/** Convenience type re-export */
export type { Decimal as DecimalType } from 'decimal.js'

/**
 * Parse a value from Postgres numeric column (string) or UI input
 * into a Decimal instance. Returns Decimal(0) for null/undefined.
 */
export function toDecimal(value: string | number | null | undefined): _Decimal {
  if (value === null || value === undefined || value === '') {
    return new _Decimal(0)
  }
  return new _Decimal(value)
}

/**
 * Format a Decimal value to a fixed 2-decimal-place string,
 * suitable for storing back into Postgres numeric(15,2) columns.
 */
export function toDbNumeric(value: _Decimal): string {
  return value.toFixed(2)
}

import { describe, it, expect } from 'vitest'
import { formatValue, compactNumber, normalizeText } from '../composables/useFormat'
import type { Indicator } from '../composables/useIndicators'

const gdp: Indicator = { id: 'gdp', group: 'x', label: 'HDP', unit: 'USD', higherIsBetter: true, source: 'worldbank', decimals: 0 }
const pct: Indicator = { id: 'inflation', group: 'x', label: 'Inflace', unit: '%', higherIsBetter: false, source: 'worldbank', decimals: 1 }

describe('formatValue', () => {
  it('zkracuje velká čísla u HDP/populace (mld/mil)', () => {
    expect(formatValue(2.5e9, gdp)).toContain('mld')
    expect(formatValue(3e6, gdp)).toContain('mil')
  })
  it('respektuje desetinná místa', () => {
    expect(formatValue(2.345, pct)).toMatch(/2[.,]3/)
  })
  it('nezkracuje procenta', () => {
    expect(formatValue(12.3, pct)).not.toContain('mld')
  })
})

describe('compactNumber', () => {
  it('zkracuje řády', () => {
    expect(compactNumber(1500)).toContain('tis')
    expect(compactNumber(2_000_000)).toContain('mil')
    expect(compactNumber(3_000_000_000)).toContain('mld')
  })
})

describe('normalizeText', () => {
  it('odstraní diakritiku a velikost písmen', () => {
    expect(normalizeText('Česká Republika')).toBe('ceska republika')
    expect(normalizeText('ŠVÝCARSKO')).toBe('svycarsko')
  })
})

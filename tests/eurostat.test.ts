import { describe, it, expect } from 'vitest'
import { parseJsonStat } from '../composables/useEurostat'

// JSON-stat: dims [freq, geo, time], geo obsahuje agregát EU27_2020 (přeskočit),
// EL (Řecko→GRC) a CZ (→CZE). Lineární index = freq*6 + geo*2 + time.
const fixture = {
  id: ['freq', 'geo', 'time'],
  size: [1, 3, 2],
  dimension: {
    freq: { category: { index: { A: 0 } } },
    geo: { category: { index: { EU27_2020: 0, EL: 1, CZ: 2 } } },
    time: { category: { index: { '2020': 0, '2021': 1 } } },
  },
  value: {
    '0': 999, '1': 999, // EU27 agregát
    '2': 10, '3': 11, // EL 2020/2021
    '4': 20, '5': 21, // CZ 2020/2021
  },
}

describe('parseJsonStat', () => {
  it('mapuje geo kódy na ISO-3 (EL→GRC, CZ→CZE) a přeskakuje agregáty', () => {
    const d = parseJsonStat(fixture)
    expect(Object.keys(d.byCountry).sort()).toEqual(['CZE', 'GRC'])
    expect(d.byCountry.GRC).toEqual({ 2020: 10, 2021: 11 })
    expect(d.byCountry.CZE).toEqual({ 2020: 20, 2021: 21 })
  })

  it('počítá roky a rozsah', () => {
    const d = parseJsonStat(fixture)
    expect(d.years).toEqual([2020, 2021])
    expect(d.minYear).toBe(2020)
    expect(d.maxYear).toBe(2021)
    expect(d.defaultYear).toBe(2021)
  })

  it('področní období (YYYY-Sx): poslední pololetí roku vyhrává', () => {
    const semester = {
      id: ['geo', 'time'],
      size: [1, 3],
      dimension: {
        geo: { category: { index: { CZ: 0 } } },
        time: { category: { index: { '2024-S1': 0, '2024-S2': 1, '2025-S1': 2 } } },
      },
      value: { '0': 900, '1': 924, '2': 950 },
    }
    const d = parseJsonStat(semester)
    expect(d.byCountry.CZE).toEqual({ 2024: 924, 2025: 950 })
  })

  it('přeskakuje chybějící hodnoty', () => {
    const sparse = {
      id: ['geo', 'time'],
      size: [1, 2],
      dimension: {
        geo: { category: { index: { CZ: 0 } } },
        time: { category: { index: { '2020': 0, '2021': 1 } } },
      },
      value: { '1': 42 }, // 2020 chybí
    }
    const d = parseJsonStat(sparse)
    expect(d.byCountry.CZE).toEqual({ 2021: 42 })
  })
})

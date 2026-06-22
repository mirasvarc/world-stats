import { describe, it, expect } from 'vitest'
import { valueAtOrNearest, valueAt, type IndicatorData } from '../composables/useStatsData'

const data: IndicatorData = {
  byCountry: {
    CZE: { 2010: 100, 2015: 150, 2020: 200 },
    SVK: {},
  },
  years: [2010, 2015, 2020],
  minYear: 2010,
  maxYear: 2020,
  defaultYear: 2020,
  isStatic: false,
}

describe('valueAt', () => {
  it('vrátí přesnou hodnotu nebo null', () => {
    expect(valueAt(data, 'CZE', 2015)).toBe(150)
    expect(valueAt(data, 'CZE', 2016)).toBeNull()
    expect(valueAt(data, 'XXX', 2015)).toBeNull()
  })
})

describe('valueAtOrNearest', () => {
  it('přesný rok → exact:true', () => {
    expect(valueAtOrNearest(data, 'CZE', 2015)).toEqual({ value: 150, year: 2015, exact: true })
  })
  it('chybějící rok → nejbližší dostupný (exact:false)', () => {
    expect(valueAtOrNearest(data, 'CZE', 2014)).toEqual({ value: 150, year: 2015, exact: false })
    expect(valueAtOrNearest(data, 'CZE', 2019)).toEqual({ value: 200, year: 2020, exact: false })
  })
  it('při shodné vzdálenosti vyhrává novější rok', () => {
    const tie: IndicatorData = {
      byCountry: { AAA: { 2000: 1, 2010: 2 } },
      years: [2000, 2010], minYear: 2000, maxYear: 2010, defaultYear: 2010, isStatic: false,
    }
    // 2005 je přesně mezi 2000 a 2010 → vybere novější (2010)
    expect(valueAtOrNearest(tie, 'AAA', 2005)).toEqual({ value: 2, year: 2010, exact: false })
  })
  it('respektuje maxGap', () => {
    expect(valueAtOrNearest(data, 'CZE', 2050, 12)).toBeNull()
    expect(valueAtOrNearest(data, 'CZE', 2050, 100)).toEqual({ value: 200, year: 2020, exact: false })
  })
  it('země bez dat → null', () => {
    expect(valueAtOrNearest(data, 'SVK', 2015)).toBeNull()
    expect(valueAtOrNearest(data, 'XXX', 2015)).toBeNull()
    expect(valueAtOrNearest(null, 'CZE', 2015)).toBeNull()
  })
})

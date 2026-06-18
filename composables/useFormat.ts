// Pomocné funkce pro formátování hodnot a textu (bez stavu).

import type { Indicator } from './useIndicators'

const LOCALE = 'cs-CZ'

/** Formátování hodnoty pro zobrazení v panelu/grafu (zkrácení velkých čísel u HDP/populace). */
export function formatValue(value: number, ind: Indicator): string {
  const decimals = ind.decimals ?? 0
  const big = ind.id === 'gdp' || ind.id === 'population'
  if (big && Math.abs(value) >= 1e9) {
    return (value / 1e9).toLocaleString(LOCALE, { maximumFractionDigits: 2 }) + ' mld'
  }
  if (big && Math.abs(value) >= 1e6) {
    return (value / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 2 }) + ' mil'
  }
  return value.toLocaleString(LOCALE, { maximumFractionDigits: decimals })
}

/** Kompaktní formát čísla pro popisky os grafu (tis/mil/mld/bil). */
export function compactNumber(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e12) return (v / 1e12).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + ' bil'
  if (a >= 1e9) return (v / 1e9).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + ' mld'
  if (a >= 1e6) return (v / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + ' mil'
  if (a >= 1e3) return (v / 1e3).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + ' tis'
  return v.toLocaleString(LOCALE, { maximumFractionDigits: 1 })
}

/** Procentuální formát se znaménkem (pro „změnu za období"). */
export function formatPercent(v: number): string {
  return Math.abs(v).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + ' %'
}

/** Normalizace textu pro vyhledávání – bez diakritiky a velikosti písmen. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

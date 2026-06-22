// Pomocné funkce pro formátování hodnot a textu (bez stavu).

import type { Indicator } from './useIndicators'

// Jazyk formátování čísel – přepíná se z i18n (plugin i18n-format.client.ts).
let currentLang: 'cs' | 'en' = 'cs'
export function setFormatLocale(lang: string) {
  currentLang = lang === 'en' ? 'en' : 'cs'
}
function locale(): string {
  return currentLang === 'en' ? 'en-US' : 'cs-CZ'
}
// Zkratky řádů podle jazyka
const SCALE = {
  cs: { k: ' tis', mil: ' mil', mld: ' mld', bil: ' bil' },
  en: { k: 'k', mil: 'M', mld: 'bn', bil: 'T' },
}
function sc() {
  return SCALE[currentLang]
}

/** Formátování hodnoty pro zobrazení v panelu/grafu (zkrácení velkých čísel u HDP/populace). */
export function formatValue(value: number, ind: Indicator): string {
  const decimals = ind.decimals ?? 0
  const big = ind.id === 'gdp' || ind.id === 'population'
  if (big && Math.abs(value) >= 1e9) {
    return (value / 1e9).toLocaleString(locale(), { maximumFractionDigits: 2 }) + sc().mld
  }
  if (big && Math.abs(value) >= 1e6) {
    return (value / 1e6).toLocaleString(locale(), { maximumFractionDigits: 2 }) + sc().mil
  }
  return value.toLocaleString(locale(), { maximumFractionDigits: decimals })
}

/** Kompaktní formát čísla pro popisky os grafu (tis/mil/mld/bil). */
export function compactNumber(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e12) return (v / 1e12).toLocaleString(locale(), { maximumFractionDigits: 1 }) + sc().bil
  if (a >= 1e9) return (v / 1e9).toLocaleString(locale(), { maximumFractionDigits: 1 }) + sc().mld
  if (a >= 1e6) return (v / 1e6).toLocaleString(locale(), { maximumFractionDigits: 1 }) + sc().mil
  if (a >= 1e3) return (v / 1e3).toLocaleString(locale(), { maximumFractionDigits: 1 }) + sc().k
  return v.toLocaleString(locale(), { maximumFractionDigits: 1 })
}

/** Procentuální formát se znaménkem (pro „změnu za období"). */
export function formatPercent(v: number): string {
  return Math.abs(v).toLocaleString(locale(), { maximumFractionDigits: 1 }) + ' %'
}

/** Normalizace textu pro vyhledávání – bez diakritiky a velikosti písmen. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

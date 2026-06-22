// Lokalizace názvů statistik, jednotek, skupin a kontinentů (přes vue-i18n).
// Klíče jsou id indikátoru / kanonické (české) názvy skupin a kontinentů.

import type { Indicator } from './useIndicators'

export function useLabels() {
  const { t } = useI18n()

  function label(ind: Indicator, opts: { perCapita?: boolean } = {}): string {
    let s = t(`ind.${ind.id}`)
    if (ind.source === 'eurostat') s += t('eurostatSuffix')
    if (opts.perCapita && ind.perCapita) s += t('perCapitaSuffix')
    return s
  }

  function unit(ind: Indicator, perCapita = false): string {
    if (perCapita && ind.perCapita) return t(`unitPc.${ind.id}`)
    return t(`unit.${ind.id}`)
  }

  const group = (name: string): string => t(`grp.${name}`)
  const continent = (name: string): string => t(`cont.${name}`)

  return { label, unit, group, continent }
}

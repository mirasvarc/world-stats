// Trvalý (sdílitelný) odkaz: stav (statistika/rok/země) se promítá do URL
// a dá se zkopírovat. Voláno jednou v kořenové komponentě (registruje watcher).

import { useWorldStats } from './useWorldStats'

export function useShareLink() {
  const s = useWorldStats()
  const copied = ref(false)
  let copiedTimer: ReturnType<typeof setTimeout> | null = null

  function buildUrl(): string {
    const p = new URLSearchParams()
    p.set('stat', s.selectedIndicatorId.value)
    if (!s.isStatic.value) p.set('year', String(s.selectedYear.value))
    if (s.selectedIso3.value) p.set('country', s.selectedIso3.value)
    if (s.compareIsos.value.length) p.set('compare', s.compareIsos.value.join(','))
    if (s.yScaleMode.value === 'log') p.set('scale', 'log')
    return `${window.location.pathname}?${p.toString()}`
  }

  /** promítne aktuální stav do URL bez reloadu */
  function syncUrl() {
    if (typeof window === 'undefined') return
    window.history.replaceState({}, '', buildUrl())
  }

  async function copyLink() {
    syncUrl()
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      return
    }
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 1600)
  }

  // průběžná synchronizace
  watch(
    [s.selectedIndicatorId, s.selectedYear, s.selectedIso3, s.compareIsos, s.yScaleMode],
    syncUrl
  )

  return { copied, copyLink, syncUrl }
}

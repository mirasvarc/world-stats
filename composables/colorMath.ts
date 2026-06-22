// Čistá barevná matematika (bez stavu/Vue) – snadno testovatelná.
// Plynulá škála zelená → žlutá → červená podle „dobrosti" g ∈ [0,1]
// (1 = nejlepší = zelená, 0 = nejhorší = červená).

export const SCALE_STOPS = [
  [239, 68, 68], // #ef4444 červená (nejhorší)
  [234, 179, 8], // #eab308 žlutá (střed)
  [34, 197, 94], // #22c55e zelená (nejlepší)
]

export function scaleColor(g: number): string {
  const t = Math.max(0, Math.min(1, g)) * 2
  const i = Math.min(1, Math.floor(t))
  const f = t - i
  const a = SCALE_STOPS[i]
  const b = SCALE_STOPS[i + 1]
  const r = Math.round(a[0] + (b[0] - a[0]) * f)
  const gg = Math.round(a[1] + (b[1] - a[1]) * f)
  const bl = Math.round(a[2] + (b[2] - a[2]) * f)
  return `rgb(${r}, ${gg}, ${bl})`
}

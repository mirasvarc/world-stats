// Export dat: žebříček do CSV, graf do SVG/PNG. Bez stavu (čisté funkce).

import type { Indicator } from './useIndicators'
import { formatValue } from './useFormat'
import type { RankRow } from './useRanking'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvCell(s: string): string {
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export interface CsvOpts {
  /** lokalizovaný název statistiky a jednotka (do hlavičky) */
  label: string
  unit: string
  year: number
  /** lokalizované názvy sloupců */
  cols: { rank: string; country: string; continent: string }
  /** překlad názvu kontinentu */
  cont: (c: string) => string
}

/** Žebříček → CSV (oddělovač `;`, BOM kvůli Excelu, desetinná čárka). */
export function exportRankingCsv(rows: RankRow[], ind: Indicator, opts: CsvOpts) {
  const header = [opts.cols.rank, opts.cols.country, opts.cols.continent, `${opts.label} [${opts.unit}]`]
  const lines = [header.map(csvCell).join(';')]
  for (const r of rows) {
    lines.push(
      [
        String(r.rank),
        csvCell(r.name),
        csvCell(opts.cont(r.continent)),
        csvCell(formatValue(r.value, ind)),
      ].join(';')
    )
  }
  const csv = '﻿' + lines.join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${ind.id}-${opts.year}.csv`)
}

/** Naklonuje SVG grafu, vloží styly os a bílé pozadí, vrátí XML řetězec. */
function serializeChartSvg(svgEl: SVGSVGElement): { xml: string; w: number; h: number } {
  const vb = (svgEl.getAttribute('viewBox') || '0 0 680 360').split(/\s+/).map(Number)
  const w = vb[2] || 680
  const h = vb[3] || 360

  const clone = svgEl.cloneNode(true) as SVGSVGElement
  // odstraníme interaktivní prvky (crosshair/overlay), ať nejsou v exportu
  clone.querySelectorAll('[data-export-ignore]').forEach((n) => n.remove())
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent =
    ".axis-label{font-size:11px;fill:#94a3b8;font-family:system-ui,-apple-system,sans-serif}"
  clone.insertBefore(style, clone.firstChild)

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('x', '0')
  bg.setAttribute('y', '0')
  bg.setAttribute('width', String(w))
  bg.setAttribute('height', String(h))
  bg.setAttribute('fill', '#ffffff')
  clone.insertBefore(bg, style.nextSibling)

  return { xml: new XMLSerializer().serializeToString(clone), w, h }
}

export function exportChartSvg(svgEl: SVGSVGElement, name: string) {
  const { xml } = serializeChartSvg(svgEl)
  downloadBlob(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }), `${name}.svg`)
}

export function exportChartPng(svgEl: SVGSVGElement, name: string, scale = 2) {
  const { xml, w, h } = serializeChartSvg(svgEl)
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${name}.png`)
    }, 'image/png')
  }
  img.src = url
}

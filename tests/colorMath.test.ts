import { describe, it, expect } from 'vitest'
import { scaleColor } from '../composables/colorMath'

describe('scaleColor', () => {
  it('0 = červená (nejhorší)', () => {
    expect(scaleColor(0)).toBe('rgb(239, 68, 68)')
  })
  it('1 = zelená (nejlepší)', () => {
    expect(scaleColor(1)).toBe('rgb(34, 197, 94)')
  })
  it('0.5 = žlutá (střed)', () => {
    expect(scaleColor(0.5)).toBe('rgb(234, 179, 8)')
  })
  it('ořezává mimo rozsah [0,1]', () => {
    expect(scaleColor(-5)).toBe(scaleColor(0))
    expect(scaleColor(5)).toBe(scaleColor(1))
  })
  it('interpoluje mezi zastávkami', () => {
    // 0.25 je půl cesty mezi červenou a žlutou
    expect(scaleColor(0.25)).toBe('rgb(237, 124, 38)')
  })
})

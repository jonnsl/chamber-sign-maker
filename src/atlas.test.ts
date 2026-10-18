import { describe, expect, it } from 'vitest'
import {
  ATLAS_HEIGHT,
  ATLAS_WIDTH,
  ICON_IDS,
  atlas,
  atlasEntries,
  iconNames,
  isIconId,
  uprightSize,
  type AtlasRect,
} from './atlas'
import { iconDescriptions } from './iconDescriptions'

const overlaps = (a: AtlasRect, b: AtlasRect) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height

describe('atlas', () => {
  it.each(atlasEntries())('%s is a valid rectangle in the texture', (_, r) => {
    for (const v of [r.x, r.y, r.width, r.height]) {
      expect(Number.isInteger(v)).toBe(true)
    }
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.width).toBeGreaterThan(0)
    expect(r.height).toBeGreaterThan(0)
    expect(r.x + r.width).toBeLessThanOrEqual(ATLAS_WIDTH)
    expect(r.y + r.height).toBeLessThanOrEqual(ATLAS_HEIGHT)
    expect([0, 90, -90]).toContain(r.rotation)
  })

  it('has exactly 10 square icons that do not overlap', () => {
    expect(ICON_IDS).toHaveLength(10)
    const rects = ICON_IDS.map((id) => atlas.icons[id])
    for (const r of rects) expect(r.width).toBe(r.height)
    rects.forEach((a, i) =>
      rects.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)),
    )
  })

  it('has every digit, upright and taller than wide', () => {
    expect(atlas.bigDigits).toHaveLength(10)
    expect(atlas.smallDigits).toHaveLength(10)
    for (const r of [...atlas.bigDigits, ...atlas.smallDigits]) {
      const { width, height } = uprightSize(r)
      expect(height).toBeGreaterThan(width)
    }
  })

  it('stores the big zero and the logo sideways', () => {
    expect(atlas.bigDigits[0].rotation).not.toBe(0)
    expect(uprightSize(atlas.bigDigits[0]).height).toBeGreaterThan(400)
    expect(atlas.logo.rotation).not.toBe(0)
    const logo = uprightSize(atlas.logo)
    expect(logo.width).toBeGreaterThan(logo.height)
  })

  it('names and describes every icon', () => {
    for (const id of ICON_IDS) {
      expect(iconNames[id]).toBeTruthy()
      expect(iconDescriptions[id]).toBeTruthy()
    }
    expect(Object.keys(iconDescriptions).sort()).toEqual([...ICON_IDS].sort())
  })

  it('recognises icon ids', () => {
    expect(isIconId('cake')).toBe(true)
    expect(isIconId('portal-gun')).toBe(false)
    expect(isIconId(undefined)).toBe(false)
  })
})

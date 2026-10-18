import { describe, expect, it } from 'vitest'
import { atlas } from '../atlas'
import { DEFAULT_STATE, EMPTY_SLOT, type SignState } from '../state'
import { createMockContext, fakeTextures } from '../test/mockCanvas'
import { INACTIVE_OPACITY, layoutSign, type DrawOp } from './layout'
import { paintSign, type PaintOptions } from './paint'

const regionOps = (ops: readonly DrawOp[]) =>
  ops.filter((op) => op.kind === 'region')

describe('layoutSign', () => {
  it('uses big and small digits for the zero-padded numbers', () => {
    const { ops } = layoutSign({ ...DEFAULT_STATE, current: 4, total: 19 })
    const regions = regionOps(ops).map((op) => op.region)
    expect(regions.slice(0, 2)).toEqual([
      atlas.bigDigits[0],
      atlas.bigDigits[4],
    ])
    expect(regions.slice(2, 7)).toEqual([
      atlas.smallDigits[0],
      atlas.smallDigits[4],
      atlas.slash,
      atlas.smallDigits[1],
      atlas.smallDigits[9],
    ])
  })

  it('draws one progress tick per chamber, lit up to the current one', () => {
    const { ops } = layoutSign({ ...DEFAULT_STATE, current: 7, total: 12 })
    const ticks = regionOps(ops).filter(
      (op) => op.region === atlas.progressTick,
    )
    expect(ticks).toHaveLength(12)
    expect(ticks.filter((t) => t.lit)).toHaveLength(7)
  })

  it('renders chamber 00 with the sideways big zero and no lit ticks', () => {
    const { ops } = layoutSign({ ...DEFAULT_STATE, current: 0, total: 19 })
    const regions = regionOps(ops)
    expect(regions.slice(0, 2).map((op) => op.region)).toEqual([
      atlas.bigDigits[0],
      atlas.bigDigits[0],
    ])
    const ticks = regions.filter((op) => op.region === atlas.progressTick)
    expect(ticks.filter((t) => t.lit)).toHaveLength(0)
  })

  it('keeps every element inside the sign, even with 98 chambers', () => {
    const layout = layoutSign({ ...DEFAULT_STATE, current: 98, total: 98 })
    for (const op of layout.ops) {
      expect(op.x).toBeGreaterThanOrEqual(0)
      expect(op.y).toBeGreaterThanOrEqual(0)
      expect(op.x + op.width).toBeLessThanOrEqual(layout.width)
      expect(op.y + op.height).toBeLessThanOrEqual(layout.height)
    }
  })

  it('maps slots to icons, unlit icons and placeholders', () => {
    const state: SignState = {
      ...DEFAULT_STATE,
      slots: [
        { icon: 'cake', active: true },
        { icon: 'turret-hazard', active: false },
        ...Array(8).fill(EMPTY_SLOT),
      ],
    }
    const { ops } = layoutSign(state)
    expect(ops.filter((op) => op.kind === 'placeholder')).toHaveLength(8)
    const cake = regionOps(ops).find((op) => op.region === atlas.icons.cake)
    const turret = regionOps(ops).find(
      (op) => op.region === atlas.icons['turret-hazard'],
    )
    expect(cake?.lit).toBe(true)
    expect(turret?.lit).toBe(false)
  })
})

describe('paintSign', () => {
  const state: SignState = {
    current: 1,
    total: 1,
    slots: [{ icon: 'cake', active: false }, ...Array(9).fill(EMPTY_SLOT)],
  }
  const base: PaintOptions = {
    scale: 2,
    background: null,
    inactiveStyle: 'opacity',
    showPlaceholders: false,
  }
  const textures = fakeTextures()
  const cakeCall = (ctx: ReturnType<typeof createMockContext>) =>
    ctx.drawImage.mock.calls.find(
      (call) =>
        call[1] === atlas.icons.cake.x && call[2] === atlas.icons.cake.y,
    )

  it('dims inactive icons with opacity by default', () => {
    const ctx = createMockContext()
    const alphas: number[] = []
    ctx.drawImage.mockImplementation(() => alphas.push(ctx.globalAlpha))
    paintSign(ctx, layoutSign(state), textures, base)
    expect(alphas).toContain(INACTIVE_OPACITY)
    expect(cakeCall(ctx)?.[0]).toBe(textures.lit.source)
  })

  it('can use the grey texture for inactive icons', () => {
    const ctx = createMockContext()
    paintSign(ctx, layoutSign(state), textures, {
      ...base,
      inactiveStyle: 'grey-texture',
    })
    expect(cakeCall(ctx)?.[0]).toBe(textures.grey!.source)
  })

  it('fills a solid background and only outlines placeholders on request', () => {
    const ctx = createMockContext()
    paintSign(ctx, layoutSign(state), textures, base)
    expect(ctx.fillRect).not.toHaveBeenCalled()
    expect(ctx.strokeRect).not.toHaveBeenCalled()

    const ctx2 = createMockContext()
    paintSign(ctx2, layoutSign(state), textures, {
      ...base,
      background: '#ffffff',
      showPlaceholders: true,
    })
    expect(ctx2.fillRect).toHaveBeenCalledTimes(1)
    expect(ctx2.strokeRect).toHaveBeenCalledTimes(9)
  })
})

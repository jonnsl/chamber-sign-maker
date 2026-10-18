import { describe, expect, it, vi } from 'vitest'
import { exportFilename, exportSize, renderSignToBlob } from './export'
import { layoutSign } from './render/layout'
import { DEFAULT_STATE, EMPTY_SLOT } from './state'
import { createMockContext, fakeTextures } from './test/mockCanvas'

describe('export', () => {
  it('names files after the zero-padded chamber numbers', () => {
    expect(exportFilename({ ...DEFAULT_STATE, current: 4, total: 19 })).toBe(
      'chamber-04-of-19.png',
    )
    expect(exportFilename({ ...DEFAULT_STATE, current: 12, total: 98 })).toBe(
      'chamber-12-of-98.png',
    )
  })

  it('scales the output size', () => {
    const base = layoutSign(DEFAULT_STATE)
    expect(exportSize(DEFAULT_STATE, 3)).toEqual({
      width: base.width * 3,
      height: base.height * 3,
    })
  })

  it('renders at the chosen scale without editor placeholders', async () => {
    const ctx = createMockContext()
    const canvases: HTMLCanvasElement[] = []
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      function (this: HTMLCanvasElement) {
        canvases.push(this)
        return ctx
      } as unknown as typeof HTMLCanvasElement.prototype.getContext,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) =>
      cb(new Blob(['png'], { type: 'image/png' })),
    )

    const state = {
      ...DEFAULT_STATE,
      slots: DEFAULT_STATE.slots.map((s, i) => (i === 0 ? EMPTY_SLOT : s)),
    }
    const blob = await renderSignToBlob(state, fakeTextures(), {
      scale: 2,
      background: null,
      inactiveStyle: 'opacity',
    })
    expect(blob.type).toBe('image/png')
    expect(canvases[0]!.width).toBe(layoutSign(state).width * 2)
    expect(ctx.strokeRect).not.toHaveBeenCalled()
    const { width, height } = layoutSign(state)
    expect(ctx.fillRect).not.toHaveBeenCalledWith(0, 0, width * 2, height * 2)
  })
})

import { vi } from 'vitest'
import { ATLAS_HEIGHT, ATLAS_WIDTH } from '../atlas'
import type { TextureImage, Textures } from '../textures/types'

/** Stand-in for a decoded texture; never touches real game assets. */
export function fakeTexture(name = 'lit'): TextureImage {
  return {
    source: { name } as unknown as CanvasImageSource,
    width: ATLAS_WIDTH,
    height: ATLAS_HEIGHT,
  }
}

export function fakeTextures(withGrey = true): Textures {
  return {
    lit: fakeTexture('lit'),
    grey: withGrey ? fakeTexture('grey') : null,
  }
}

/** A 2D context whose drawing calls are recorded with vi.fn(). */
export function createMockContext() {
  return {
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low' as ImageSmoothingQuality,
    fillStyle: '#000' as string | CanvasGradient | CanvasPattern,
    strokeStyle: '#000' as string | CanvasGradient | CanvasPattern,
    lineWidth: 1,
  }
}

export type MockContext = ReturnType<typeof createMockContext>

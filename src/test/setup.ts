import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { createMockContext } from './mockCanvas'

// jsdom has no canvas implementation; hand out a recording mock instead so
// components that draw atlas crops can render without the game textures.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      return createMockContext() as unknown as CanvasRenderingContext2D
    } as unknown as typeof HTMLCanvasElement.prototype.getContext,
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  history.replaceState(null, '', '/')
})

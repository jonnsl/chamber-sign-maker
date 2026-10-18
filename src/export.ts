import { layoutSign } from './render/layout'
import { paintSign, type InactiveStyle } from './render/paint'
import { padChamber, type SignState } from './state'
import type { Textures } from './textures/types'

export interface ExportOptions {
  scale: number
  background: string | null
  inactiveStyle: InactiveStyle
}

/** e.g. "chamber-04-of-19.png" */
export function exportFilename(state: SignState): string {
  return `chamber-${padChamber(state.current)}-of-${padChamber(state.total)}.png`
}

export function exportSize(state: SignState, scale: number) {
  const { width, height } = layoutSign(state)
  return { width: width * scale, height: height * scale }
}

/** Render the sign offscreen with the same painter as the live preview. */
export function renderSignToBlob(
  state: SignState,
  textures: Textures,
  options: ExportOptions,
): Promise<Blob> {
  const layout = layoutSign(state)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(layout.width * options.scale)
  canvas.height = Math.round(layout.height * options.scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available.'))
  paintSign(ctx, layout, textures, { ...options, showPlaceholders: false })
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('PNG encoding failed.')),
      'image/png',
    ),
  )
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

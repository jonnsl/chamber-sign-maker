import { ATLAS_HEIGHT, ATLAS_WIDTH } from '../atlas'
import type { TextureImage, TextureKey } from './types'

export class TextureError extends Error {
  override name = 'TextureError'
}

/** Lit artwork reaches full opacity; the grey copy tops out around 15%. */
const LIT_MIN_PEAK_ALPHA = 128

function peakAlpha(bitmap: ImageBitmap): number | null {
  // Downsampled probe: plenty to tell ~255 from ~38 peak alpha.
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let max = 0
  for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]!)
  return max
}

/**
 * Decode a user-supplied PNG and check it plausibly is the expected texture.
 * Runs entirely in the browser; the file never leaves the device.
 */
export async function decodeTexture(
  blob: Blob,
  key: TextureKey,
): Promise<TextureImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    throw new TextureError('The file could not be decoded as an image.')
  }
  const { width, height } = bitmap
  if (width * ATLAS_HEIGHT !== height * ATLAS_WIDTH || width < 256) {
    bitmap.close()
    throw new TextureError(
      `Expected a ${ATLAS_WIDTH}×${ATLAS_HEIGHT} (2:1) texture, got ${width}×${height}.`,
    )
  }
  if (key === 'lit') {
    const peak = peakAlpha(bitmap)
    if (peak !== null && peak < LIT_MIN_PEAK_ALPHA) {
      bitmap.close()
      throw new TextureError(
        'This looks like the dim awe_total_grey.png. Please choose awe_total.png here.',
      )
    }
  }
  return { source: bitmap, width, height }
}

import { ATLAS_WIDTH, type AtlasRect } from '../atlas'
import type { TextureImage } from '../textures/types'

/** The subset of CanvasRenderingContext2D the renderer needs. */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | 'drawImage'
  | 'save'
  | 'restore'
  | 'translate'
  | 'rotate'
  | 'globalAlpha'
  | 'imageSmoothingEnabled'
  | 'imageSmoothingQuality'
>

/**
 * Draw an atlas region into the upright destination box (dx, dy, dw, dh),
 * undoing the region's packing rotation and scaling atlas coordinates to
 * the actual texture resolution.
 */
export function drawRegion(
  ctx: DrawContext,
  texture: TextureImage,
  region: AtlasRect,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  alpha = 1,
): void {
  const k = texture.width / ATLAS_WIDTH
  const sx = region.x * k
  const sy = region.y * k
  const sw = region.width * k
  const sh = region.height * k

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (region.rotation === 0) {
    ctx.drawImage(texture.source, sx, sy, sw, sh, dx, dy, dw, dh)
  } else {
    // Stored sideways: draw the source rotated about the box centre, so
    // its stored width spans the box height and vice versa.
    ctx.translate(dx + dw / 2, dy + dh / 2)
    ctx.rotate((region.rotation * Math.PI) / 180)
    ctx.drawImage(texture.source, sx, sy, sw, sh, -dh / 2, -dw / 2, dh, dw)
  }
  ctx.restore()
}

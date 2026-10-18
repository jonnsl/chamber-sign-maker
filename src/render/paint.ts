import type { Textures } from '../textures/types'
import { drawRegion, type DrawContext } from './drawRegion'
import { INACTIVE_OPACITY, type SignLayout } from './layout'

export type InactiveStyle = 'opacity' | 'grey-texture'

export interface PaintOptions {
  /** Device pixels per logical unit. */
  scale: number
  /** CSS colour, or null for a transparent background. */
  background: string | null
  inactiveStyle: InactiveStyle
  /** Outline empty slots (editor preview only, never exported). */
  showPlaceholders: boolean
}

export type PaintContext = DrawContext &
  Pick<
    CanvasRenderingContext2D,
    | 'clearRect'
    | 'fillRect'
    | 'strokeRect'
    | 'setLineDash'
    | 'fillStyle'
    | 'strokeStyle'
    | 'lineWidth'
  >

/**
 * Paint a laid-out sign. This is the single rendering path shared by the
 * live preview and the PNG export.
 */
export function paintSign(
  ctx: PaintContext,
  layout: SignLayout,
  textures: Textures,
  options: PaintOptions,
): void {
  const s = options.scale
  ctx.clearRect(0, 0, layout.width * s, layout.height * s)
  if (options.background) {
    ctx.fillStyle = options.background
    ctx.fillRect(0, 0, layout.width * s, layout.height * s)
  }

  const useGrey = options.inactiveStyle === 'grey-texture' && textures.grey
  for (const op of layout.ops) {
    if (op.kind === 'placeholder') {
      if (!options.showPlaceholders) continue
      ctx.save()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
      ctx.lineWidth = Math.max(1, s)
      ctx.setLineDash([4 * s, 4 * s])
      const inset = 4 * s
      ctx.strokeRect(
        op.x * s + inset,
        op.y * s + inset,
        op.width * s - 2 * inset,
        op.height * s - 2 * inset,
      )
      ctx.restore()
      continue
    }
    const texture = !op.lit && useGrey ? textures.grey! : textures.lit
    const alpha = op.lit || useGrey ? 1 : INACTIVE_OPACITY
    drawRegion(
      ctx,
      texture,
      op.region,
      op.x * s,
      op.y * s,
      op.width * s,
      op.height * s,
      alpha,
    )
  }
}

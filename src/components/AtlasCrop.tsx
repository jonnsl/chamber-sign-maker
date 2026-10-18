import { useEffect, useRef } from 'react'
import { uprightSize, type AtlasRect } from '../atlas'
import { drawRegion } from '../render/drawRegion'
import { useTextures } from '../textures/TexturesContext'

interface Props {
  region: AtlasRect
  /** Rendered CSS height in px; width follows the region's aspect ratio. */
  size: number
  className?: string
}

/** A single atlas region cropped from the loaded texture (decorative). */
export function AtlasCrop({ region, size, className }: Props) {
  const textures = useTextures()
  const ref = useRef<HTMLCanvasElement>(null)
  const upright = uprightSize(region)
  const cssWidth = Math.round((size * upright.width) / upright.height)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(size * dpr)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawRegion(ctx, textures.lit, region, 0, 0, canvas.width, canvas.height)
  }, [textures, region, size, cssWidth])

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: cssWidth, height: size }}
      aria-hidden="true"
    />
  )
}

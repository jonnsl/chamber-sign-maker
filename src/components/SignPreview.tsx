import { useEffect, useMemo, useRef } from 'react'
import { iconNames } from '../atlas'
import { layoutSign } from '../render/layout'
import { paintSign, type InactiveStyle } from '../render/paint'
import { padChamber, type SignState } from '../state'
import { useTextures } from '../textures/TexturesContext'

interface Props {
  sign: SignState
  background: string | null
  inactiveStyle: InactiveStyle
}

function describe(sign: SignState): string {
  const icons = sign.slots
    .filter((s) => s.icon !== null)
    .map((s) => `${iconNames[s.icon!]}${s.active ? '' : ' (inactive)'}`)
  return `Sign preview: chamber ${padChamber(sign.current)} of ${padChamber(sign.total)}. Icons: ${icons.length ? icons.join(', ') : 'none'}.`
}

export function SignPreview({ sign, background, inactiveStyle }: Props) {
  const textures = useTextures()
  const ref = useRef<HTMLCanvasElement>(null)
  const layout = useMemo(() => layoutSign(sign), [sign])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    // Render at device resolution (at least 2x so downscaled CSS stays crisp).
    const scale = Math.max(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(layout.width * scale)
    canvas.height = Math.round(layout.height * scale)
    paintSign(ctx, layout, textures, {
      scale,
      background,
      inactiveStyle,
      showPlaceholders: true,
    })
  }, [layout, textures, background, inactiveStyle])

  return (
    <div
      className={`preview${background ? '' : ' preview-transparent'}`}
      style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
    >
      <canvas ref={ref} role="img" aria-label={describe(sign)} />
    </div>
  )
}

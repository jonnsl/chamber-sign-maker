import { useId, useState } from 'react'
import {
  downloadBlob,
  exportFilename,
  exportSize,
  renderSignToBlob,
} from '../export'
import type { InactiveStyle } from '../render/paint'
import { EXPORT_SCALES, type ExportScale } from '../settings'
import type { SignState } from '../state'
import { useTextures } from '../textures/TexturesContext'

interface Props {
  sign: SignState
  scale: ExportScale
  onScaleChange: (scale: ExportScale) => void
  background: string | null
  inactiveStyle: InactiveStyle
}

export function ExportPanel({
  sign,
  scale,
  onScaleChange,
  background,
  inactiveStyle,
}: Props) {
  const id = useId()
  const textures = useTextures()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const filename = exportFilename(sign)

  const download = async () => {
    setBusy(true)
    setStatus('')
    try {
      const blob = await renderSignToBlob(sign, textures, {
        scale,
        background,
        inactiveStyle,
      })
      downloadBlob(blob, filename)
      setStatus(`Saved ${filename}.`)
    } catch (error) {
      setStatus(
        `Export failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset>
      <legend>Export</legend>
      <div
        className="scale-options"
        role="radiogroup"
        aria-labelledby={`${id}-scale`}
      >
        <span id={`${id}-scale`} className="label">
          Resolution
        </span>
        {EXPORT_SCALES.map((s) => {
          const size = exportSize(sign, s)
          return (
            <label key={s} className="scale-option">
              <input
                type="radio"
                name={`${id}-scale`}
                value={s}
                checked={scale === s}
                onChange={() => onScaleChange(s)}
              />
              {s}×{' '}
              <span className="hint">
                ({size.width}×{size.height})
              </span>
            </label>
          )
        })}
      </div>
      <p className="hint">
        Background: {background ? 'solid colour' : 'transparent'} (change it
        under Appearance).
      </p>
      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={download}
          disabled={busy}
        >
          {busy ? 'Rendering…' : 'Download PNG'}
        </button>
      </div>
      <p className="hint" role="status">
        {status || `File name: ${filename}`}
      </p>
    </fieldset>
  )
}

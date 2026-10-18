import { useId, useState, type FormEvent } from 'react'
import { cacheTexture, clearCachedTextures } from '../textures/cache'
import { decodeTexture, TextureError } from '../textures/decode'
import {
  TEXTURE_FILES,
  type TextureKey,
  type Textures,
} from '../textures/types'

interface Props {
  onReady: (textures: Textures) => void
  /** Shown when the user came here on purpose to swap textures. */
  onCancel?: () => void
}

const VPK_DIR = 'materials/models/props_animsigns/'

export function SetupScreen({ onReady, onCancel }: Props) {
  const id = useId()
  const [files, setFiles] = useState<Partial<Record<TextureKey, File>>>({})
  const [errors, setErrors] = useState<Partial<Record<TextureKey, string>>>({})
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)

  const pick = (key: TextureKey, file: File | undefined) => {
    setFiles((prev) => ({ ...prev, [key]: file }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const decodeField = async (key: TextureKey) => {
    const file = files[key]
    if (!file) return null
    try {
      return await decodeTexture(file, key)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [key]:
          error instanceof TextureError ? error.message : 'Unexpected error.',
      }))
      throw error
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!files.lit) {
      setErrors({ lit: `Choose ${TEXTURE_FILES.lit} to continue.` })
      return
    }
    setBusy(true)
    try {
      const [lit, grey] = await Promise.all([
        decodeField('lit'),
        decodeField('grey'),
      ])
      if (!lit) return
      await clearCachedTextures()
      if (remember) {
        await cacheTexture('lit', files.lit)
        if (files.grey) await cacheTexture('grey', files.grey)
      }
      onReady({ lit, grey })
    } catch {
      // Field errors are already displayed.
    } finally {
      setBusy(false)
    }
  }

  const field = (key: TextureKey, label: string, hint: string) => {
    const inputId = `${id}-${key}`
    const error = errors[key]
    return (
      <div className="field">
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          type="file"
          accept="image/png"
          aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ''}`}
          aria-invalid={error ? true : undefined}
          onChange={(e) => pick(key, e.currentTarget.files?.[0])}
        />
        <p id={`${inputId}-hint`} className="hint">
          {hint}
        </p>
        {error && (
          <p id={`${inputId}-error`} className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <main className="setup">
      <h1>Chamber Sign Maker</h1>
      <section aria-labelledby={`${id}-title`} className="panel">
        <h2 id={`${id}-title`}>Game textures needed</h2>
        <p>
          This fan-made tool draws signs using the original artwork from{' '}
          <em>Portal</em> (2007). No game assets ship with it, so please supply
          the textures from your own legally obtained copy of the game.
        </p>
        <ul>
          <li>
            <code>{TEXTURE_FILES.lit}</code>: <strong>required</strong>, the lit
            sign artwork.
          </li>
          <li>
            <code>{TEXTURE_FILES.grey}</code>: optional, the game&apos;s unlit
            copy, which can be used for inactive icons.
          </li>
        </ul>

        <details>
          <summary>How to extract them from the game</summary>
          <ol>
            <li>
              Find <code>portal_pak_dir.vpk</code> in your Portal install,
              usually <code>Steam/steamapps/common/Portal/portal/</code>.
            </li>
            <li>
              Open it with a VPK browser such as VPKEdit or GCFScape and extract{' '}
              <code>{VPK_DIR}awe_total.vtf</code> and{' '}
              <code>{VPK_DIR}awe_total_grey.vtf</code>.
            </li>
            <li>
              Convert both VTF files to PNG <strong>with alpha</strong>, e.g.
              with VTFEdit (File → Export) or the <code>no_vtf</code> command
              line tool. Keep the names <code>awe_total.png</code> and{' '}
              <code>awe_total_grey.png</code>.
            </li>
            {import.meta.env.DEV && (
              <li>
                Developing locally? Put the PNGs in the project&apos;s{' '}
                <code>assets/</code> folder (or its root) and reload. They are
                git-ignored.
              </li>
            )}
          </ol>
        </details>

        <form onSubmit={submit} noValidate>
          {field(
            'lit',
            `${TEXTURE_FILES.lit} (required)`,
            '2048×1024 PNG with transparency.',
          )}
          {field(
            'grey',
            `${TEXTURE_FILES.grey} (optional)`,
            'Enables the "game unlit texture" style for inactive icons.',
          )}
          <div className="field checkbox">
            <input
              id={`${id}-remember`}
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.currentTarget.checked)}
            />
            <label htmlFor={`${id}-remember`}>
              Remember these files in this browser (IndexedDB)
            </label>
          </div>
          <p className="hint">
            Files are processed entirely on your device and are never uploaded.
          </p>
          <div className="actions">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Loading…' : 'Use these textures'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  )
}

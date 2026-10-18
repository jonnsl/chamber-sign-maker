import { useEffect, useId, useReducer, useRef, useState } from 'react'
import { loadInitialState, saveState } from '../persistence'
import { useSettings } from '../settings'
import { parseState, signReducer } from '../state'
import { useTextures } from '../textures/TexturesContext'
import { ChamberFields } from './ChamberFields'
import { ExportPanel } from './ExportPanel'
import { IconPicker } from './IconPicker'
import { IconSlot } from './IconSlot'
import { SignPreview } from './SignPreview'

interface Props {
  onChangeTextures: () => void
}

export function Editor({ onChangeTextures }: Props) {
  const id = useId()
  const textures = useTextures()
  const [sign, dispatch] = useReducer(signReducer, undefined, loadInitialState)
  const [settings, updateSettings] = useSettings()

  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const slotButtons = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => saveState(sign), [sign])

  const closePicker = () => {
    const slot = pickerSlot
    setPickerSlot(null)
    // Return focus to the slot that opened the picker.
    if (slot !== null) slotButtons.current[slot]?.focus()
  }

  // Pasting a share link into the address bar of an open tab.
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseState(window.location.hash)
      if (parsed) dispatch({ type: 'replace', state: parsed })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // The grey style needs the optional texture; fall back if it's missing.
  const inactiveStyle = textures.grey ? settings.inactiveStyle : 'opacity'
  const background =
    settings.backgroundMode === 'solid' ? settings.backgroundColor : null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chamber Sign Maker</h1>
        <button type="button" onClick={onChangeTextures}>
          Change textures
        </button>
      </header>

      <main className="editor">
        <section className="preview-pane" aria-label="Preview">
          <SignPreview
            sign={sign}
            background={background}
            inactiveStyle={inactiveStyle}
          />
        </section>

        <section className="controls" aria-label="Sign settings">
          <ChamberFields
            current={sign.current}
            total={sign.total}
            onChange={(current, total) =>
              dispatch({ type: 'setChambers', current, total })
            }
          />

          <fieldset>
            <legend>Icons</legend>
            <ul className="slots">
              {sign.slots.map((slot, i) => (
                <IconSlot
                  key={i}
                  index={i}
                  slot={slot}
                  onOpenPicker={() => setPickerSlot(i)}
                  pickerButtonRef={(el) => {
                    slotButtons.current[i] = el
                  }}
                  onToggleActive={() =>
                    dispatch({ type: 'toggleActive', slot: i })
                  }
                />
              ))}
            </ul>
          </fieldset>

          <fieldset>
            <legend>Appearance</legend>
            <div className="field">
              <label htmlFor={`${id}-inactive`}>Inactive icons</label>
              <select
                id={`${id}-inactive`}
                value={inactiveStyle}
                onChange={(e) =>
                  updateSettings({
                    inactiveStyle: e.currentTarget.value as
                      'opacity' | 'grey-texture',
                  })
                }
              >
                <option value="opacity">Dimmed (25% opacity)</option>
                <option value="grey-texture" disabled={!textures.grey}>
                  Game unlit texture (awe_total_grey)
                  {textures.grey ? '' : ' (not loaded)'}
                </option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`${id}-bg`}>Background</label>
              <select
                id={`${id}-bg`}
                value={settings.backgroundMode}
                onChange={(e) =>
                  updateSettings({
                    backgroundMode: e.currentTarget.value as
                      'solid' | 'transparent',
                  })
                }
              >
                <option value="solid">Solid colour</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
            {settings.backgroundMode === 'solid' && (
              <div className="field">
                <label htmlFor={`${id}-bgcolor`}>Background colour</label>
                <input
                  id={`${id}-bgcolor`}
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    updateSettings({ backgroundColor: e.currentTarget.value })
                  }
                />
              </div>
            )}
          </fieldset>

          <ExportPanel
            sign={sign}
            scale={settings.exportScale}
            onScaleChange={(exportScale) => updateSettings({ exportScale })}
            background={background}
            inactiveStyle={inactiveStyle}
          />
        </section>
      </main>

      {pickerSlot !== null && (
        <IconPicker
          slotIndex={pickerSlot}
          value={sign.slots[pickerSlot]?.icon ?? null}
          onSelect={(icon) => {
            dispatch({ type: 'setIcon', slot: pickerSlot, icon })
            closePicker()
          }}
          onClose={closePicker}
        />
      )}

      <footer className="app-footer">
        <p>
          Fan project, not affiliated with or endorsed by Valve. No game assets
          are included; textures are loaded from your own copy of Portal and
          stay on your device.
        </p>
      </footer>
    </div>
  )
}

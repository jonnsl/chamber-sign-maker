import { useId, type Ref } from 'react'
import { atlas, iconNames } from '../atlas'
import type { Slot } from '../state'
import { AtlasCrop } from './AtlasCrop'

interface Props {
  index: number
  slot: Slot
  onOpenPicker: () => void
  onToggleActive: () => void
  pickerButtonRef?: Ref<HTMLButtonElement>
}

export function IconSlot({
  index,
  slot,
  onOpenPicker,
  onToggleActive,
  pickerButtonRef,
}: Props) {
  const id = useId()
  const name = slot.icon ? iconNames[slot.icon] : 'Empty'
  const state = slot.icon ? (slot.active ? 'active' : 'inactive') : 'empty'

  return (
    <li className="slot" data-state={state}>
      <button
        ref={pickerButtonRef}
        type="button"
        className="slot-button"
        aria-haspopup="dialog"
        aria-label={`Slot ${index + 1}: ${name}${slot.icon ? `, ${state}` : ''}. Change icon`}
        onClick={onOpenPicker}
      >
        {slot.icon ? (
          <span className="slot-thumb">
            <AtlasCrop region={atlas.icons[slot.icon]} size={56} />
          </span>
        ) : (
          <span className="slot-empty" aria-hidden="true" />
        )}
        <span className="slot-name" aria-hidden="true">
          {name}
        </span>
      </button>
      <div className="slot-toggle">
        <input
          id={`${id}-active`}
          type="checkbox"
          role="switch"
          checked={slot.icon !== null && slot.active}
          disabled={slot.icon === null}
          onChange={onToggleActive}
        />
        <label htmlFor={`${id}-active`}>
          Active<span className="visually-hidden"> (slot {index + 1})</span>
        </label>
      </div>
    </li>
  )
}

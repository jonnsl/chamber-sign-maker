import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { atlas, ICON_IDS, iconNames, type IconId } from '../atlas'
import { emptyDescription, iconDescriptions } from '../iconDescriptions'
import { AtlasCrop } from './AtlasCrop'

interface Props {
  slotIndex: number
  value: IconId | null
  onSelect: (icon: IconId | null) => void
  onClose: () => void
}

const OPTIONS: ReadonlyArray<IconId | null> = [null, ...ICON_IDS]

/**
 * Modal listbox of every atlas icon plus "Empty".
 * Keyboard: arrows / Home / End move, Enter or Space picks, Escape closes,
 * Tab cycles between the list and the close button (focus is trapped).
 */
export function IconPicker({ slotIndex, value, onSelect, onClose }: Props) {
  const id = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(() =>
    Math.max(0, OPTIONS.indexOf(value)),
  )
  const optionId = (i: number) => `${id}-option-${i}`

  useEffect(() => {
    listRef.current?.focus()
  }, [])

  useEffect(() => {
    document
      .getElementById(`${id}-option-${active}`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [id, active])

  const onListKeyDown = (event: KeyboardEvent) => {
    const last = OPTIONS.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowRight: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      ArrowLeft: Math.max(0, active - 1),
      Home: 0,
      End: last,
    }
    if (event.key in moves) {
      event.preventDefault()
      setActive(moves[event.key]!)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(OPTIONS[active] ?? null)
    }
  }

  const onDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    } else if (event.key === 'Tab') {
      // Two focusable elements: the list and the close button.
      event.preventDefault()
      const target =
        document.activeElement === listRef.current
          ? closeRef.current
          : listRef.current
      target?.focus()
    }
  }

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div
        className="picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={onDialogKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="picker-header">
          <h2 id={`${id}-title`}>Choose icon for slot {slotIndex + 1}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul
          ref={listRef}
          className="picker-list"
          role="listbox"
          tabIndex={0}
          aria-labelledby={`${id}-title`}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
        >
          {OPTIONS.map((icon, i) => (
            <li
              key={icon ?? 'empty'}
              id={optionId(i)}
              role="option"
              aria-selected={icon === value}
              className={`picker-option${i === active ? ' is-active' : ''}`}
              onClick={() => onSelect(icon)}
              onMouseMove={() => setActive(i)}
            >
              <span className="picker-thumb">
                {icon ? (
                  <AtlasCrop region={atlas.icons[icon]} size={48} />
                ) : (
                  <span className="slot-empty" />
                )}
              </span>
              <span className="picker-text">
                <span className="picker-name">
                  {icon ? iconNames[icon] : 'Empty'}
                  {icon === value && (
                    <span className="picker-current"> (current)</span>
                  )}
                </span>
                <span className="picker-desc">
                  {icon ? iconDescriptions[icon] : emptyDescription}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

import { useId, useState } from 'react'
import {
  MAX_CHAMBER,
  MIN_CHAMBER,
  padChamber,
  parseChamberInput,
  validateChambers,
} from '../state'

interface Props {
  current: number
  total: number
  onChange: (current: number, total: number) => void
}

/**
 * The two number fields. Typing is kept as draft text so intermediate
 * values (e.g. raising the current number before the total) don't fight
 * the user; the sign only updates once the pair is valid.
 */
export function ChamberFields({ current, total, onChange }: Props) {
  const id = useId()
  const [draft, setDraft] = useState({
    current: padChamber(current),
    total: padChamber(total),
  })

  // Follow external changes (e.g. a pasted share link) by adjusting the
  // draft during render when the committed values change.
  const [committed, setCommitted] = useState({ current, total })
  if (committed.current !== current || committed.total !== total) {
    setCommitted({ current, total })
    if (
      parseChamberInput(draft.current) !== current ||
      parseChamberInput(draft.total) !== total
    ) {
      setDraft({ current: padChamber(current), total: padChamber(total) })
    }
  }

  const validation = validateChambers(draft.current, draft.total)
  const errors = validation.ok ? {} : validation.errors

  const update = (field: 'current' | 'total', value: string) => {
    const next = { ...draft, [field]: value }
    setDraft(next)
    const v = validateChambers(next.current, next.total)
    if (v.ok) onChange(v.current, v.total)
  }

  const normalize = () => {
    if (validation.ok) {
      setDraft({
        current: padChamber(validation.current),
        total: padChamber(validation.total),
      })
    }
  }

  const field = (key: 'current' | 'total', label: string) => {
    const inputId = `${id}-${key}`
    const error = errors[key]
    return (
      <div className="field">
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          value={draft[key]}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : `${id}-hint`}
          onChange={(e) => update(key, e.currentTarget.value)}
          onBlur={normalize}
        />
        {error && (
          <p id={`${inputId}-error`} className="error">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <fieldset className="chambers">
      <legend>Chamber</legend>
      <div className="chambers-row">
        {field('current', 'Chamber number')}
        <span className="chambers-sep" aria-hidden="true">
          /
        </span>
        {field('total', 'Total chambers')}
      </div>
      <p id={`${id}-hint`} className="hint">
        {padChamber(MIN_CHAMBER)}–{MAX_CHAMBER}, shown as{' '}
        <output>
          {validation.ok
            ? `${padChamber(validation.current)} / ${padChamber(validation.total)}`
            : `${padChamber(current)} / ${padChamber(total)}`}
        </output>
        .
      </p>
    </fieldset>
  )
}

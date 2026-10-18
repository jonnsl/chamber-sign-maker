import { ICON_IDS, isIconId, type IconId } from './atlas'

/** Number of icon slots on the sign (matches the 10 icons in the atlas). */
export const SLOT_COUNT = 10

/**
 * Chamber numbers are integers below 99, shown with 2 digits. The current
 * chamber may be 00 (Portal's first chamber); the total must be at least 01.
 */
export const MIN_CHAMBER = 0
export const MIN_TOTAL = 1
export const MAX_CHAMBER = 98

export interface Slot {
  readonly icon: IconId | null
  readonly active: boolean
}

export interface SignState {
  readonly current: number
  readonly total: number
  readonly slots: readonly Slot[]
}

export const DEFAULT_STATE: SignState = {
  current: 4,
  total: 19,
  slots: ICON_IDS.map((icon, i) => ({ icon, active: i < 3 })),
}

export const EMPTY_SLOT: Slot = { icon: null, active: false }

/** Zero-pad a chamber number to two digits ("4" -> "04"). */
export function padChamber(n: number): string {
  return String(n).padStart(2, '0')
}

function inRange(n: number | null, min: number): n is number {
  return n !== null && Number.isInteger(n) && n >= min && n <= MAX_CHAMBER
}

const rangeMessage = (min: number) =>
  `Enter a whole number from ${padChamber(min)} to ${MAX_CHAMBER}.`

/** Parse a user-typed chamber number; null unless it's 1-2 plain digits. */
export function parseChamberInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d{1,2}$/.test(trimmed)) return null
  return Number(trimmed)
}

export type ChamberValidation =
  | { ok: true; current: number; total: number }
  | { ok: false; errors: { current?: string; total?: string } }

/** Validate the two number fields together (current must not exceed total). */
export function validateChambers(
  currentRaw: string,
  totalRaw: string,
): ChamberValidation {
  const current = parseChamberInput(currentRaw)
  const total = parseChamberInput(totalRaw)
  const errors: { current?: string; total?: string } = {}
  if (!inRange(current, MIN_CHAMBER)) errors.current = rangeMessage(MIN_CHAMBER)
  if (!inRange(total, MIN_TOTAL)) errors.total = rangeMessage(MIN_TOTAL)
  if (
    !errors.current &&
    !errors.total &&
    current !== null &&
    total !== null &&
    current > total
  ) {
    errors.current = `The chamber number can't be greater than the total (${padChamber(total)}).`
  }
  if (errors.current || errors.total || current === null || total === null) {
    return { ok: false, errors }
  }
  return { ok: true, current, total }
}

export type SignAction =
  | { type: 'setChambers'; current: number; total: number }
  | { type: 'setIcon'; slot: number; icon: IconId | null }
  | { type: 'toggleActive'; slot: number }
  | { type: 'replace'; state: SignState }

function updateSlot(
  slots: readonly Slot[],
  index: number,
  update: (slot: Slot) => Slot,
): readonly Slot[] {
  if (index < 0 || index >= slots.length) return slots
  return slots.map((slot, i) => (i === index ? update(slot) : slot))
}

export function signReducer(state: SignState, action: SignAction): SignState {
  switch (action.type) {
    case 'setChambers': {
      const v = validateChambers(String(action.current), String(action.total))
      return v.ok ? { ...state, current: v.current, total: v.total } : state
    }
    case 'setIcon':
      return {
        ...state,
        slots: updateSlot(state.slots, action.slot, (slot) =>
          action.icon === null
            ? EMPTY_SLOT
            : // Picking an icon into an empty slot lights it up by default.
              { icon: action.icon, active: slot.icon === null || slot.active },
        ),
      }
    case 'toggleActive':
      return {
        ...state,
        slots: updateSlot(state.slots, action.slot, (slot) =>
          slot.icon === null ? slot : { ...slot, active: !slot.active },
        ),
      }
    case 'replace':
      return action.state
  }
}

/*
 * URL hash format (human-readable, versioned):
 *   #v=1&n=04&t=19&s=cube-dispenser,~cube-hazard,_,...
 * Each slot is "<icon-id>" (active), "~<icon-id>" (inactive) or "_" (empty).
 */
const HASH_VERSION = '1'
const EMPTY_TOKEN = '_'
const INACTIVE_PREFIX = '~'

export function serializeState(state: SignState): string {
  const slots = state.slots
    .map((slot) =>
      slot.icon === null
        ? EMPTY_TOKEN
        : `${slot.active ? '' : INACTIVE_PREFIX}${slot.icon}`,
    )
    .join(',')
  const params = new URLSearchParams({
    v: HASH_VERSION,
    n: padChamber(state.current),
    t: padChamber(state.total),
    s: slots,
  })
  // Keep "," and "~" readable in shared links (both are valid in a hash).
  return params.toString().replace(/%2C/gi, ',').replace(/%7E/gi, '~')
}

function parseSlot(token: string): Slot {
  const active = !token.startsWith(INACTIVE_PREFIX)
  const id = active ? token : token.slice(INACTIVE_PREFIX.length)
  return isIconId(id) ? { icon: id, active } : EMPTY_SLOT
}

/**
 * Parse a serialized state (with or without a leading "#"). Returns null if
 * the string isn't a sign configuration at all; otherwise tolerates junk by
 * falling back to defaults field by field.
 */
export function parseState(serialized: string): SignState | null {
  const params = new URLSearchParams(serialized.replace(/^#/, ''))
  if (params.get('v') !== HASH_VERSION) return null

  const chambers = validateChambers(
    params.get('n') ?? '',
    params.get('t') ?? '',
  )
  const { current, total } = chambers.ok ? chambers : DEFAULT_STATE

  const tokens = params.get('s')?.split(',') ?? []
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) =>
    parseSlot(tokens[i] ?? EMPTY_TOKEN),
  )
  return { current, total, slots }
}

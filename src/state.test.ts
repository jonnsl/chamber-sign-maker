import { describe, expect, it } from 'vitest'
import { ICON_IDS } from './atlas'
import {
  DEFAULT_STATE,
  EMPTY_SLOT,
  MAX_CHAMBER,
  SLOT_COUNT,
  padChamber,
  parseChamberInput,
  parseState,
  serializeState,
  signReducer,
  validateChambers,
  type SignState,
} from './state'

describe('padChamber', () => {
  it('zero-pads to two digits', () => {
    expect(padChamber(0)).toBe('00')
    expect(padChamber(1)).toBe('01')
    expect(padChamber(4)).toBe('04')
    expect(padChamber(19)).toBe('19')
    expect(padChamber(98)).toBe('98')
  })
})

describe('parseChamberInput', () => {
  it.each([
    ['4', 4],
    ['04', 4],
    [' 19 ', 19],
  ])('parses %j', (raw, expected) => {
    expect(parseChamberInput(raw)).toBe(expected)
  })

  it.each(['', 'abc', '1.5', '-3', '1e1', '123', '+4'])('rejects %j', (raw) => {
    expect(parseChamberInput(raw)).toBeNull()
  })
})

describe('validateChambers', () => {
  it('accepts current <= total within range', () => {
    expect(validateChambers('04', '19')).toEqual({
      ok: true,
      current: 4,
      total: 19,
    })
    expect(validateChambers('19', '19')).toMatchObject({ ok: true })
    expect(validateChambers('1', '98')).toMatchObject({ ok: true })
  })

  it('rejects current greater than total', () => {
    const v = validateChambers('20', '19')
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.errors.current).toMatch(/greater than the total/)
      expect(v.errors.total).toBeUndefined()
    }
  })

  it('allows chamber 00 but requires a total of at least 01', () => {
    expect(validateChambers('00', '19')).toEqual({
      ok: true,
      current: 0,
      total: 19,
    })
    expect(validateChambers('0', '0')).toEqual({
      ok: false,
      errors: { total: expect.stringMatching(/from 01 to 98/) },
    })
  })

  it('requires whole numbers below 99', () => {
    for (const [c, t] of [
      ['00', '00'],
      ['4', '99'],
      ['x', '19'],
      ['4', ''],
    ] as const) {
      expect(validateChambers(c, t).ok).toBe(false)
    }
    expect(MAX_CHAMBER).toBeLessThan(99)
  })

  it('reports errors on the offending field only', () => {
    const v = validateChambers('04', '0')
    expect(v).toEqual({
      ok: false,
      errors: { total: expect.any(String) },
    })
  })
})

describe('signReducer', () => {
  it('sets chambers only when valid', () => {
    const s = signReducer(DEFAULT_STATE, {
      type: 'setChambers',
      current: 7,
      total: 9,
    })
    expect([s.current, s.total]).toEqual([7, 9])
    expect(signReducer(s, { type: 'setChambers', current: 10, total: 9 })).toBe(
      s,
    )
  })

  it('toggles active state but never on empty slots', () => {
    const toggled = signReducer(DEFAULT_STATE, {
      type: 'toggleActive',
      slot: 0,
    })
    expect(toggled.slots[0]!.active).toBe(!DEFAULT_STATE.slots[0]!.active)

    const emptied = signReducer(DEFAULT_STATE, {
      type: 'setIcon',
      slot: 2,
      icon: null,
    })
    expect(emptied.slots[2]).toEqual(EMPTY_SLOT)
    const again = signReducer(emptied, { type: 'toggleActive', slot: 2 })
    expect(again.slots[2]).toEqual(EMPTY_SLOT)
  })

  it('lights an icon placed into an empty slot, keeps state otherwise', () => {
    const emptied = signReducer(DEFAULT_STATE, {
      type: 'setIcon',
      slot: 5,
      icon: null,
    })
    const filled = signReducer(emptied, {
      type: 'setIcon',
      slot: 5,
      icon: 'cake',
    })
    expect(filled.slots[5]).toEqual({ icon: 'cake', active: true })

    // Slot 9 is inactive by default; swapping its icon keeps it inactive.
    const swapped = signReducer(DEFAULT_STATE, {
      type: 'setIcon',
      slot: 9,
      icon: 'turret-hazard',
    })
    expect(swapped.slots[9]).toEqual({ icon: 'turret-hazard', active: false })
  })

  it('ignores out-of-range slots', () => {
    expect(
      signReducer(DEFAULT_STATE, { type: 'toggleActive', slot: 99 }).slots,
    ).toBe(DEFAULT_STATE.slots)
  })
})

describe('URL hash serialization', () => {
  const state: SignState = {
    current: 4,
    total: 19,
    slots: [
      { icon: 'cube-dispenser', active: true },
      { icon: 'cube-hazard', active: false },
      EMPTY_SLOT,
      ...ICON_IDS.slice(3).map((icon) => ({ icon, active: true })),
    ],
  }

  it('produces a readable, zero-padded hash', () => {
    const hash = serializeState(state)
    expect(hash).toMatch(/^v=1&n=04&t=19&s=cube-dispenser,~cube-hazard,_,/)
  })

  it('round-trips chamber 00', () => {
    const zero = { ...state, current: 0 }
    expect(serializeState(zero)).toContain('n=00&')
    expect(parseState(serializeState(zero))).toEqual(zero)
  })

  it('round-trips', () => {
    expect(parseState(serializeState(state))).toEqual(state)
    expect(parseState(`#${serializeState(DEFAULT_STATE)}`)).toEqual(
      DEFAULT_STATE,
    )
  })

  it('returns null for unrelated hashes', () => {
    expect(parseState('')).toBeNull()
    expect(parseState('#section-2')).toBeNull()
    expect(parseState('#v=2&n=04')).toBeNull()
  })

  it('tolerates junk field by field', () => {
    const parsed = parseState('#v=1&n=30&t=19&s=cake,~nope,~turret-hazard')
    expect(parsed).not.toBeNull()
    expect(parsed!.current).toBe(DEFAULT_STATE.current)
    expect(parsed!.total).toBe(DEFAULT_STATE.total)
    expect(parsed!.slots).toHaveLength(SLOT_COUNT)
    expect(parsed!.slots.slice(0, 4)).toEqual([
      { icon: 'cake', active: true },
      EMPTY_SLOT,
      { icon: 'turret-hazard', active: false },
      EMPTY_SLOT,
    ])
  })

  it('ignores extra slots', () => {
    const many = Array(15).fill('cake').join(',')
    expect(parseState(`v=1&n=01&t=02&s=${many}`)!.slots).toHaveLength(
      SLOT_COUNT,
    )
  })
})

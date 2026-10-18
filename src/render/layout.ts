import { atlas, uprightSize, type AtlasRect } from '../atlas'
import { padChamber, type SignState } from '../state'

/*
 * Sign layout in logical units (1x export = 1 unit per pixel):
 *
 *   ┌──────────────────────────┐
 *   │ 04                       │  big chamber number
 *   │ 04/19 ||||||||||||||||   │  counter + one progress tick per chamber
 *   │ [] [] [] [] []           │  10 icon slots, 2 rows of 5
 *   │ [] [] [] [] []           │
 *   │ (O) APERTURE             │  logo
 *   └──────────────────────────┘
 */
export const SIGN_WIDTH = 512
const MARGIN = 36
const CONTENT_WIDTH = SIGN_WIDTH - 2 * MARGIN

const BIG_HEIGHT = 300
const BIG_NOMINAL = 422 // tallest big-digit region, so all share one scale
const BIG_GAP = 16

const SMALL_HEIGHT = 36
const SMALL_NOMINAL = 78
const SMALL_GAP = 3

const TICK_GAP_FROM_COUNTER = 18
const ICON_COLUMNS = 5
const ICON_GAP = 8
const ICON_SIZE = (CONTENT_WIDTH - (ICON_COLUMNS - 1) * ICON_GAP) / ICON_COLUMNS
const LOGO_WIDTH = 220
const SECTION_GAP = 28

/** Opacity used for inactive icons and remaining progress ticks. */
export const INACTIVE_OPACITY = 0.25

export type DrawOp =
  | {
      kind: 'region'
      region: AtlasRect
      x: number
      y: number
      width: number
      height: number
      /** false = an unlit element (inactive icon, future progress tick). */
      lit: boolean
    }
  | {
      /** Empty icon slot; drawn only in the editor preview. */
      kind: 'placeholder'
      x: number
      y: number
      width: number
      height: number
    }

export interface SignLayout {
  readonly width: number
  readonly height: number
  readonly ops: readonly DrawOp[]
}

/** Lay out a run of glyphs vertically centred on a line; returns end x. */
function layoutGlyphs(
  ops: DrawOp[],
  glyphs: readonly AtlasRect[],
  x: number,
  top: number,
  lineHeight: number,
  scale: number,
  gap: number,
): number {
  let cursor = x
  glyphs.forEach((region, i) => {
    const size = uprightSize(region)
    const width = size.width * scale
    const height = size.height * scale
    ops.push({
      kind: 'region',
      region,
      x: cursor,
      y: top + (lineHeight - height) / 2,
      width,
      height,
      lit: true,
    })
    cursor += width + (i < glyphs.length - 1 ? gap : 0)
  })
  return cursor
}

function digitsOf(n: number, table: readonly AtlasRect[]): AtlasRect[] {
  return [...padChamber(n)].map((d) => table[Number(d)]!)
}

/** Pure layout: turns sign state into positioned draw operations. */
export function layoutSign(state: SignState): SignLayout {
  const ops: DrawOp[] = []
  let y = MARGIN

  // Big chamber number.
  layoutGlyphs(
    ops,
    digitsOf(state.current, atlas.bigDigits),
    MARGIN,
    y,
    BIG_HEIGHT,
    BIG_HEIGHT / BIG_NOMINAL,
    BIG_GAP,
  )
  y += BIG_HEIGHT + SECTION_GAP

  // "04/19" counter.
  const counterEnd = layoutGlyphs(
    ops,
    [
      ...digitsOf(state.current, atlas.smallDigits),
      atlas.slash,
      ...digitsOf(state.total, atlas.smallDigits),
    ],
    MARGIN,
    y,
    SMALL_HEIGHT,
    SMALL_HEIGHT / SMALL_NOMINAL,
    SMALL_GAP,
  )

  // Progress ticks: one per chamber, lit up to the current one. They share
  // the remaining width and shrink (never grow) to fit up to 98 chambers.
  const tick = uprightSize(atlas.progressTick)
  const tickScale = SMALL_HEIGHT / tick.height
  const naturalWidth = tick.width * tickScale
  const tickStart = counterEnd + TICK_GAP_FROM_COUNTER
  const pitch = Math.min(
    naturalWidth * 2,
    (MARGIN + CONTENT_WIDTH - tickStart) / state.total,
  )
  const tickWidth = Math.min(naturalWidth, pitch * 0.6)
  for (let i = 0; i < state.total; i++) {
    ops.push({
      kind: 'region',
      region: atlas.progressTick,
      x: tickStart + i * pitch,
      y,
      width: tickWidth,
      height: SMALL_HEIGHT,
      lit: i < state.current,
    })
  }
  y += SMALL_HEIGHT + SECTION_GAP

  // Icon grid.
  const rows = Math.ceil(state.slots.length / ICON_COLUMNS)
  state.slots.forEach((slot, i) => {
    const box = {
      x: MARGIN + (i % ICON_COLUMNS) * (ICON_SIZE + ICON_GAP),
      y: y + Math.floor(i / ICON_COLUMNS) * (ICON_SIZE + ICON_GAP),
      width: ICON_SIZE,
      height: ICON_SIZE,
    }
    ops.push(
      slot.icon === null
        ? { kind: 'placeholder', ...box }
        : {
            kind: 'region',
            region: atlas.icons[slot.icon],
            ...box,
            lit: slot.active,
          },
    )
  })
  y += rows * ICON_SIZE + (rows - 1) * ICON_GAP + SECTION_GAP

  // Aperture Laboratories logo.
  const logo = uprightSize(atlas.logo)
  const logoHeight = (LOGO_WIDTH * logo.height) / logo.width
  ops.push({
    kind: 'region',
    region: atlas.logo,
    x: MARGIN,
    y,
    width: LOGO_WIDTH,
    height: logoHeight,
    lit: true,
  })
  y += logoHeight + MARGIN

  return { width: SIGN_WIDTH, height: Math.ceil(y), ops }
}

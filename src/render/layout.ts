import { atlas, uprightSize, type AtlasRect } from '../atlas'
import { padChamber, type SignState } from '../state'

/*
 * Sign layout in logical units (1x export = 1 unit per pixel), measured
 * from an in-game screenshot of the chamber 02 sign (471x952). All "ink"
 * values below are where the visible artwork sits; atlas regions carry
 * PAD px of transparent padding, which is subtracted when placing them.
 *
 *   ┌────────────────────┐
 *   │                    │
 *   │        02          │  big number, centred
 *   │                    │
 *   │ 02/19              │  counter
 *   │ ────────────────── │  rule
 *   │ ||||||||           │  one 4-bar block per chamber reached
 *   │                    │
 *   │ ────────────────── │  rule
 *   │ [] [] [] [] []     │  icons, 2 rows of 5
 *   │ [] [] [] [] []     │
 *   │                    │
 *   │ (O)APERTURE        │  logo
 *   └────────────────────┘
 */
export const SIGN_WIDTH = 471
export const SIGN_HEIGHT = 952

/** Transparent padding around every atlas region (see atlas.ts). */
const PAD = 2

/** Left/right edges shared by the rules, progress bar and icon grid. */
const CONTENT_LEFT = 95
const CONTENT_RIGHT = 455

const BIG = {
  inkTop: 97,
  inkHeight: 339,
  /** Ink height of the tallest big digit in the atlas. */
  atlasInkHeight: 418,
  /** The game draws the digits ~1% narrower than their native aspect. */
  widthFactor: 0.99,
  centerX: 233,
  inkGap: 49,
}

const COUNTER = {
  inkLeft: 104,
  inkTop: 519,
  inkHeight: 15,
  atlasInkHeight: 74,
  inkGap: 4,
}

const RULES = [
  { y: 538.75, height: 1.25 },
  { y: 670, height: 1.75 },
]

const PROGRESS = {
  inkTop: 543,
  inkHeight: 20,
  /**
   * The 65px atlas region spans exactly four bar periods, so blocks tile
   * edge to edge into one evenly spaced row of bars (4.86px apart).
   */
  blockPitch: 19.43,
  atlasInkHeight: 136,
}

const ICONS = {
  columns: 5,
  inkLeft: CONTENT_LEFT,
  inkTop: 677,
  /** Frame size on the sign, and the frame's size in the atlas. */
  inkSize: 63.5,
  atlasInkSize: 333,
  columnPitch: 73.75,
  rowPitch: 71,
}

const LOGO = {
  inkLeft: 101,
  inkWidth: 105,
  /** Drawn ~10% taller than the texture's aspect ratio. */
  inkHeight: 29.5,
  centerY: 913.5,
  atlasInkWidth: 589,
  atlasInkHeight: 148,
}

/** Opacity used for inactive icons. */
export const INACTIVE_OPACITY = 0.25

interface Box {
  x: number
  y: number
  width: number
  height: number
}

export type DrawOp =
  | ({
      kind: 'region'
      region: AtlasRect
      /** false = an unlit element (inactive icon). */
      lit: boolean
    } & Box)
  | ({
      /** Empty icon slot; drawn only in the editor preview. */
      kind: 'placeholder'
    } & Box)
  | ({
      /** Solid horizontal rule (not part of the atlas). */
      kind: 'rule'
    } & Box)

export interface SignLayout {
  readonly width: number
  readonly height: number
  readonly ops: readonly DrawOp[]
}

/** Upright box of a region drawn at the given scale, before positioning. */
function scaledSize(region: AtlasRect, sx: number, sy = sx) {
  const size = uprightSize(region)
  return { width: size.width * sx, height: size.height * sy }
}

/**
 * Lay out a run of glyphs left to right, vertically centred on centerY,
 * with inkGap between the visible ink of neighbouring glyphs.
 */
function layoutRun(
  glyphs: readonly AtlasRect[],
  inkLeft: number,
  centerY: number,
  scale: number,
  inkGap: number,
  scaleX = scale,
): DrawOp[] {
  const pad = PAD * scaleX
  let x = inkLeft - pad
  return glyphs.map((region) => {
    const { width, height } = scaledSize(region, scaleX, scale)
    const op: DrawOp = {
      kind: 'region',
      region,
      x,
      y: centerY - height / 2,
      width,
      height,
      lit: true,
    }
    x += width - 2 * pad + inkGap
    return op
  })
}

/** Total ink width of a run laid out by layoutRun(). */
function runInkWidth(
  glyphs: readonly AtlasRect[],
  scaleX: number,
  inkGap: number,
): number {
  const pad = PAD * scaleX
  return (
    glyphs.reduce((sum, r) => sum + scaledSize(r, scaleX).width - 2 * pad, 0) +
    inkGap * (glyphs.length - 1)
  )
}

function digitsOf(n: number, table: readonly AtlasRect[]): AtlasRect[] {
  return [...padChamber(n)].map((d) => table[Number(d)]!)
}

/** Pure layout: turns sign state into positioned draw operations. */
export function layoutSign(state: SignState): SignLayout {
  const ops: DrawOp[] = []

  // Big chamber number, centred horizontally.
  const bigDigits = digitsOf(state.current, atlas.bigDigits)
  const bigScale = BIG.inkHeight / BIG.atlasInkHeight
  const bigScaleX = bigScale * BIG.widthFactor
  ops.push(
    ...layoutRun(
      bigDigits,
      BIG.centerX - runInkWidth(bigDigits, bigScaleX, BIG.inkGap) / 2,
      BIG.inkTop + BIG.inkHeight / 2,
      bigScale,
      BIG.inkGap,
      bigScaleX,
    ),
  )

  // "02/19" counter above the first rule.
  ops.push(
    ...layoutRun(
      [
        ...digitsOf(state.current, atlas.smallDigits),
        atlas.slash,
        ...digitsOf(state.total, atlas.smallDigits),
      ],
      COUNTER.inkLeft,
      COUNTER.inkTop + COUNTER.inkHeight / 2,
      COUNTER.inkHeight / COUNTER.atlasInkHeight,
      COUNTER.inkGap,
    ),
  )

  for (const rule of RULES) {
    ops.push({
      kind: 'rule',
      x: CONTENT_LEFT,
      y: rule.y,
      width: CONTENT_RIGHT - CONTENT_LEFT,
      height: rule.height,
    })
  }

  // Progress: one 4-bar block per chamber reached (none for chamber 00).
  // Blocks keep the in-game size while `total` of them fit under the rule
  // (18 chambers), then squeeze so a full bar ends flush with the rule.
  const fit = Math.min(
    1,
    (CONTENT_RIGHT - CONTENT_LEFT) / (state.total * PROGRESS.blockPitch),
  )
  const pitch = PROGRESS.blockPitch * fit
  const bx = pitch / atlas.progressBars.width
  const by = PROGRESS.inkHeight / PROGRESS.atlasInkHeight
  const block = scaledSize(atlas.progressBars, bx, by)
  for (let i = 0; i < state.current; i++) {
    ops.push({
      kind: 'region',
      region: atlas.progressBars,
      // Offset so the first bar's ink starts on the rule's left edge.
      x: CONTENT_LEFT + i * pitch - PAD * bx,
      y: PROGRESS.inkTop - PAD * by,
      ...block,
      lit: true,
    })
  }

  // Icon grid.
  const iconScale = ICONS.inkSize / ICONS.atlasInkSize
  state.slots.forEach((slot, i) => {
    const pad = PAD * iconScale
    const size = ICONS.inkSize + 2 * pad
    const box: Box = {
      x: ICONS.inkLeft + (i % ICONS.columns) * ICONS.columnPitch - pad,
      y: ICONS.inkTop + Math.floor(i / ICONS.columns) * ICONS.rowPitch - pad,
      width: size,
      height: size,
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

  // Aperture Laboratories logo.
  const logoScaleX = LOGO.inkWidth / LOGO.atlasInkWidth
  const logoScaleY = LOGO.inkHeight / LOGO.atlasInkHeight
  const logo = scaledSize(atlas.logo, logoScaleX, logoScaleY)
  ops.push({
    kind: 'region',
    region: atlas.logo,
    x: LOGO.inkLeft - PAD * logoScaleX,
    y: LOGO.centerY - logo.height / 2,
    ...logo,
    lit: true,
  })

  return { width: SIGN_WIDTH, height: SIGN_HEIGHT, ops }
}

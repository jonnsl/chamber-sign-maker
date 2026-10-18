/**
 * Atlas metadata for Portal's `awe_total.png` / `awe_total_grey.png`
 * (materials/models/props_animsigns/ in portal_pak_dir.vpk).
 *
 * Only coordinates live in the repo; the pixels come from the user's own
 * copy of the game. Coordinates are in the native 2048x1024 texture space
 * and were measured with a connected-component pass over the alpha channel,
 * padded by 2px so anti-aliased edges are not clipped. If a texture is
 * supplied at a different resolution with the same 2:1 aspect ratio,
 * rectangles are scaled proportionally at draw time.
 */

export const ATLAS_WIDTH = 2048
export const ATLAS_HEIGHT = 1024

/** Clockwise rotation (degrees) needed to draw a region upright. */
export type AtlasRotation = 0 | 90 | -90

export interface AtlasRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  /**
   * Some glyphs are packed sideways in the texture (the big "0" and the
   * Aperture logo). Width/height above describe the region as stored; the
   * upright size is height x width when rotated.
   */
  readonly rotation: AtlasRotation
}

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: AtlasRotation = 0,
): AtlasRect => ({ x, y, width, height, rotation })

/** Upright (as-drawn) size of a region, accounting for rotation. */
export function uprightSize(r: AtlasRect): { width: number; height: number } {
  return r.rotation === 0
    ? { width: r.width, height: r.height }
    : { width: r.height, height: r.width }
}

/**
 * The 10 hazard/feature icons, in the order they appear on in-game signs.
 * Each is a 333px square (including its frame) in the left part of the
 * texture: three columns of three, plus the cake at the top of a fourth.
 */
export const ICON_IDS = [
  'cube-dispenser',
  'cube-hazard',
  'pellet-hazard',
  'pellet-catcher',
  'water-hazard',
  'fling-enter',
  'fling-exit',
  'turret-hazard',
  'dirty-water',
  'cake',
] as const

export type IconId = (typeof ICON_IDS)[number]

export function isIconId(value: unknown): value is IconId {
  return (
    typeof value === 'string' && (ICON_IDS as readonly string[]).includes(value)
  )
}

export const iconNames: Readonly<Record<IconId, string>> = {
  'cube-dispenser': 'Cube Dispenser',
  'cube-hazard': 'Cube Hazard',
  'pellet-hazard': 'Energy Pellet Hazard',
  'pellet-catcher': 'Energy Pellet Catcher',
  'water-hazard': 'Water Hazard',
  'fling-enter': 'Fling Enter',
  'fling-exit': 'Fling Exit',
  'turret-hazard': 'Turret Hazard',
  'dirty-water': 'Dirty Water',
  cake: 'Cake',
}

export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

type DigitTable = readonly [
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
  AtlasRect,
]

export interface Atlas {
  readonly icons: Readonly<Record<IconId, AtlasRect>>
  /** Large chamber-number digits (~415px tall). */
  readonly bigDigits: DigitTable
  /** Small counter digits (~74px tall), right-hand column of the texture. */
  readonly smallDigits: DigitTable
  /** "/" separator, taken from the pre-printed "/19" at the top. */
  readonly slash: AtlasRect
  /** Block of four vertical bars; the sign shows one per chamber reached. */
  readonly progressBars: AtlasRect
  /** "APERTURE LABORATORIES" logo, stored rotated. */
  readonly logo: AtlasRect
}

export const atlas: Atlas = {
  icons: {
    'cube-dispenser': rect(2, 2, 337, 337),
    'cube-hazard': rect(343, 2, 337, 337),
    'pellet-hazard': rect(684, 2, 337, 337),
    cake: rect(1026, 2, 337, 337),
    'pellet-catcher': rect(2, 342, 337, 337),
    'water-hazard': rect(343, 342, 337, 337),
    'fling-enter': rect(684, 342, 337, 337),
    'fling-exit': rect(2, 683, 337, 337),
    'turret-hazard': rect(343, 683, 337, 337),
    'dirty-water': rect(684, 683, 337, 337),
  },
  bigDigits: [
    // The "0" is packed sideways under the 1-2-3 row.
    rect(1069, 450, 421, 122, -90),
    // Starts at x=1488 rather than 1484: the rotated "0" pokes into the
    // columns left of the "1"'s flag.
    rect(1488, 161, 77, 416),
    rect(1613, 159, 127, 418),
    rect(1761, 159, 122, 421),
    rect(1028, 597, 145, 416),
    rect(1185, 598, 124, 419),
    rect(1327, 595, 122, 422),
    rect(1468, 598, 129, 415),
    rect(1617, 595, 122, 422),
    rect(1762, 595, 122, 422),
  ],
  smallDigits: [
    rect(1928, 4, 52, 78),
    rect(1994, 4, 31, 77),
    rect(1926, 90, 52, 77),
    rect(1987, 90, 52, 78),
    rect(1924, 175, 55, 77),
    rect(1986, 176, 53, 77),
    rect(1925, 258, 52, 78),
    rect(1983, 259, 52, 76),
    rect(1920, 343, 52, 78),
    rect(1986, 342, 52, 78),
  ],
  slash: rect(1385, 10, 33, 79),
  progressBars: rect(1619, 4, 65, 140),
  logo: rect(1896, 430, 152, 593, 90),
}

/** Every region in the atlas with a readable name (used by tests/tools). */
export function atlasEntries(): Array<[string, AtlasRect]> {
  return [
    ...ICON_IDS.map((id): [string, AtlasRect] => [
      `icons.${id}`,
      atlas.icons[id],
    ]),
    ...atlas.bigDigits.map((r, i): [string, AtlasRect] => [
      `bigDigits.${i}`,
      r,
    ]),
    ...atlas.smallDigits.map((r, i): [string, AtlasRect] => [
      `smallDigits.${i}`,
      r,
    ]),
    ['slash', atlas.slash],
    ['progressBars', atlas.progressBars],
    ['logo', atlas.logo],
  ]
}

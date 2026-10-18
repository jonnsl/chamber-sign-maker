/** A decoded texture plus its dimensions (abstracted so tests can fake it). */
export interface TextureImage {
  readonly source: CanvasImageSource
  readonly width: number
  readonly height: number
}

export interface Textures {
  /** awe_total.png: the lit sign artwork (required). */
  readonly lit: TextureImage
  /** awe_total_grey.png: the game's unlit variant (optional). */
  readonly grey: TextureImage | null
}

export type TextureKey = keyof Textures

export const TEXTURE_FILES: Readonly<Record<TextureKey, string>> = {
  lit: 'awe_total.png',
  grey: 'awe_total_grey.png',
}

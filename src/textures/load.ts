import { getCachedTexture } from './cache'
import { decodeTexture } from './decode'
import { TEXTURE_FILES, type TextureKey, type Textures } from './types'

export type TextureSource = 'dev-server' | 'cache' | 'file'

async function fetchDevTexture(key: TextureKey): Promise<Blob | null> {
  try {
    const response = await fetch(`/__game-textures/${TEXTURE_FILES[key]}`)
    return response.ok ? await response.blob() : null
  } catch {
    return null
  }
}

async function decodeOptional(
  blob: Blob | null,
  key: TextureKey,
): Promise<Textures[TextureKey] | null> {
  if (!blob) return null
  try {
    return await decodeTexture(blob, key)
  } catch {
    return null
  }
}

async function loadFrom(
  getBlob: (key: TextureKey) => Promise<Blob | null>,
): Promise<Textures | null> {
  const [litBlob, greyBlob] = await Promise.all([
    getBlob('lit'),
    getBlob('grey'),
  ])
  const lit = await decodeOptional(litBlob, 'lit')
  if (!lit) return null
  return { lit, grey: await decodeOptional(greyBlob, 'grey') }
}

/**
 * Find textures without user interaction: the Vite dev server (working
 * directory) in development, then the IndexedDB cache. Returns null when
 * the user needs to supply them via the setup screen.
 */
export async function loadTexturesAutomatically(): Promise<{
  textures: Textures
  source: TextureSource
} | null> {
  if (import.meta.env.DEV) {
    const textures = await loadFrom(fetchDevTexture)
    if (textures) return { textures, source: 'dev-server' }
  }
  const textures = await loadFrom(getCachedTexture)
  return textures ? { textures, source: 'cache' } : null
}

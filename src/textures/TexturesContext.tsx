import { createContext, useContext } from 'react'
import type { Textures } from './types'

export const TexturesContext = createContext<Textures | null>(null)

export function useTextures(): Textures {
  const textures = useContext(TexturesContext)
  if (!textures) throw new Error('useTextures() used outside TexturesContext')
  return textures
}

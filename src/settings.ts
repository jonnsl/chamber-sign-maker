import { useEffect, useState } from 'react'
import type { InactiveStyle } from './render/paint'

export const EXPORT_SCALES = [1, 2, 3, 4] as const
export type ExportScale = (typeof EXPORT_SCALES)[number]

export interface Settings {
  inactiveStyle: InactiveStyle
  backgroundMode: 'solid' | 'transparent'
  backgroundColor: string
  exportScale: ExportScale
}

export const DEFAULT_SETTINGS: Settings = {
  inactiveStyle: 'opacity',
  backgroundMode: 'solid',
  backgroundColor: '#ffffff',
  exportScale: 2,
}

const STORAGE_KEY = 'chamber-sign-maker:settings'

function sanitize(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS }
  if (typeof raw !== 'object' || raw === null) return s
  const r = raw as Record<string, unknown>
  if (r.inactiveStyle === 'opacity' || r.inactiveStyle === 'grey-texture')
    s.inactiveStyle = r.inactiveStyle
  if (r.backgroundMode === 'solid' || r.backgroundMode === 'transparent')
    s.backgroundMode = r.backgroundMode
  if (
    typeof r.backgroundColor === 'string' &&
    /^#[0-9a-f]{6}$/i.test(r.backgroundColor)
  )
    s.backgroundColor = r.backgroundColor
  if (EXPORT_SCALES.includes(r.exportScale as ExportScale))
    s.exportScale = r.exportScale as ExportScale
  return s
}

function load(): Settings {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Per-browser display/export preferences (not part of share links). */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Not critical.
    }
  }, [settings])
  const update = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }))
  return [settings, update] as const
}

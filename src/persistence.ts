import {
  DEFAULT_STATE,
  parseState,
  serializeState,
  type SignState,
} from './state'

const STORAGE_KEY = 'chamber-sign-maker:sign'

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Initial state: share link (URL hash) wins, then localStorage, then defaults. */
export function loadInitialState(): SignState {
  return (
    parseState(window.location.hash) ??
    parseState(readStorage() ?? '') ??
    DEFAULT_STATE
  )
}

/** Mirror the state into localStorage and the URL hash (without history spam). */
export function saveState(state: SignState): void {
  const serialized = serializeState(state)
  try {
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    // Storage may be unavailable (private mode); the hash still works.
  }
  const hash = `#${serialized}`
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash)
  }
}

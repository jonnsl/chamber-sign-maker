import type { TextureKey } from './types'

/**
 * Optional IndexedDB cache for the user's texture files, so they don't have
 * to be re-selected on every visit. Data stays in this browser only.
 */

const DB_NAME = 'chamber-sign-maker'
const STORE = 'textures'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = run(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function getCachedTexture(key: TextureKey): Promise<Blob | null> {
  try {
    const value = await withStore('readonly', (s) => s.get(key))
    return value instanceof Blob ? value : null
  } catch {
    return null
  }
}

export async function cacheTexture(key: TextureKey, blob: Blob): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(blob, key))
  } catch {
    // Caching is a convenience; private mode etc. may refuse it.
  }
}

export async function clearCachedTextures(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.clear())
  } catch {
    // Nothing to clear.
  }
}

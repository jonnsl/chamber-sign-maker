import { useEffect, useState } from 'react'
import { atlas } from './atlas'
import { AtlasCrop } from './components/AtlasCrop'
import { SetupScreen } from './components/SetupScreen'
import { loadTexturesAutomatically } from './textures/load'
import { TexturesContext } from './textures/TexturesContext'
import type { Textures } from './textures/types'

type TextureState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; textures: Textures }

export default function App() {
  const [state, setState] = useState<TextureState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    void loadTexturesAutomatically().then((result) => {
      if (cancelled) return
      setState(
        result
          ? { status: 'ready', textures: result.textures }
          : { status: 'missing' },
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <main className="setup" aria-busy="true">
        <p>Loading textures…</p>
      </main>
    )
  }
  if (state.status === 'missing') {
    return (
      <SetupScreen
        onReady={(textures) => setState({ status: 'ready', textures })}
      />
    )
  }
  return (
    <TexturesContext.Provider value={state.textures}>
      <main>
        <h1>Chamber Sign Maker</h1>
        <AtlasCrop region={atlas.logo} size={48} />
      </main>
    </TexturesContext.Provider>
  )
}

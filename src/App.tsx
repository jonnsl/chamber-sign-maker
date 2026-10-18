import { useEffect, useState } from 'react'
import { Editor } from './components/Editor'
import { SetupScreen } from './components/SetupScreen'
import { loadTexturesAutomatically } from './textures/load'
import { TexturesContext } from './textures/TexturesContext'
import type { Textures } from './textures/types'

type TextureState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; textures: Textures; changing: boolean }

export default function App() {
  const [state, setState] = useState<TextureState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    void loadTexturesAutomatically().then((result) => {
      if (cancelled) return
      setState(
        result
          ? { status: 'ready', textures: result.textures, changing: false }
          : { status: 'missing' },
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  const ready = (textures: Textures) =>
    setState({ status: 'ready', textures, changing: false })

  if (state.status === 'loading') {
    return (
      <main className="setup" aria-busy="true">
        <p>Loading textures…</p>
      </main>
    )
  }
  if (state.status === 'missing') {
    return <SetupScreen onReady={ready} />
  }
  if (state.changing) {
    return (
      <SetupScreen
        onReady={ready}
        onCancel={() => setState({ ...state, changing: false })}
      />
    )
  }
  return (
    <TexturesContext.Provider value={state.textures}>
      <Editor onChangeTextures={() => setState({ ...state, changing: true })} />
    </TexturesContext.Provider>
  )
}

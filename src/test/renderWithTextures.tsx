import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { TexturesContext } from '../textures/TexturesContext'
import { fakeTextures } from './mockCanvas'

export function renderWithTextures(ui: ReactElement, withGrey = true) {
  return render(
    <TexturesContext.Provider value={fakeTextures(withGrey)}>
      {ui}
    </TexturesContext.Provider>,
  )
}

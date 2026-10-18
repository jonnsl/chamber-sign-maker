import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SLOT, type Slot } from '../state'
import { renderWithTextures } from '../test/renderWithTextures'
import { Editor } from './Editor'
import { IconSlot } from './IconSlot'

function StatefulSlot({ initial }: { initial: Slot }) {
  const [slot, setSlot] = useState(initial)
  return (
    <ul>
      <IconSlot
        index={2}
        slot={slot}
        onOpenPicker={() => {}}
        onToggleActive={() => setSlot((s) => ({ ...s, active: !s.active }))}
      />
    </ul>
  )
}

describe('IconSlot', () => {
  it('toggles between active and inactive', async () => {
    const user = userEvent.setup()
    renderWithTextures(
      <StatefulSlot initial={{ icon: 'cube-hazard', active: true }} />,
    )
    const item = screen.getByRole('listitem')
    const toggle = screen.getByRole('switch', { name: /active.*slot 3/i })

    expect(toggle).toBeChecked()
    expect(item).toHaveAttribute('data-state', 'active')
    expect(
      screen.getByRole('button', { name: /slot 3: cube hazard, active/i }),
    ).toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(item).toHaveAttribute('data-state', 'inactive')
    expect(
      screen.getByRole('button', { name: /slot 3: cube hazard, inactive/i }),
    ).toBeInTheDocument()

    // Keyboard works too.
    toggle.focus()
    await user.keyboard(' ')
    expect(toggle).toBeChecked()
  })

  it('disables the toggle for empty slots', () => {
    const onToggle = vi.fn()
    renderWithTextures(
      <ul>
        <IconSlot
          index={0}
          slot={EMPTY_SLOT}
          onOpenPicker={() => {}}
          onToggleActive={onToggle}
        />
      </ul>,
    )
    expect(screen.getByRole('switch')).toBeDisabled()
    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'empty')
  })

  it('updates the sign state and share link from the editor', async () => {
    const user = userEvent.setup()
    renderWithTextures(<Editor onChangeTextures={() => {}} />)
    const slots = screen.getAllByRole('listitem')
    const first = within(slots[0]!).getByRole('switch')

    expect(first).toBeChecked()
    expect(window.location.hash).toContain('s=cube-dispenser,')

    await user.click(first)
    expect(first).not.toBeChecked()
    expect(window.location.hash).toContain('s=~cube-dispenser,')
  })
})

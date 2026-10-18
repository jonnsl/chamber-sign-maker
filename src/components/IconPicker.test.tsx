import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ICON_IDS } from '../atlas'
import { iconDescriptions } from '../iconDescriptions'
import { renderWithTextures } from '../test/renderWithTextures'
import { Editor } from './Editor'
import { IconPicker } from './IconPicker'

function setup(value: (typeof ICON_IDS)[number] | null = 'cake') {
  const onSelect = vi.fn()
  const onClose = vi.fn()
  renderWithTextures(
    <IconPicker
      slotIndex={0}
      value={value}
      onSelect={onSelect}
      onClose={onClose}
    />,
  )
  return { onSelect, onClose, user: userEvent.setup() }
}

describe('IconPicker', () => {
  it('lists Empty plus every icon with its description', () => {
    setup()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(ICON_IDS.length + 1)
    expect(options[0]).toHaveTextContent('Empty')
    expect(screen.getByRole('option', { name: /^Cake/ })).toHaveTextContent(
      iconDescriptions.cake,
    )
    expect(screen.getByRole('option', { name: /^Cake/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('focuses the list on the current value and navigates by keyboard', async () => {
    const { user, onSelect } = setup('cube-hazard')
    const list = screen.getByRole('listbox')
    expect(list).toHaveFocus()
    const activeName = () =>
      document.getElementById(list.getAttribute('aria-activedescendant')!)
        ?.textContent

    expect(activeName()).toMatch(/^Cube Hazard/)
    await user.keyboard('{ArrowDown}')
    expect(activeName()).toMatch(/^Energy Pellet Hazard/)
    await user.keyboard('{Home}')
    expect(activeName()).toMatch(/^Empty/)
    await user.keyboard('{End}')
    expect(activeName()).toMatch(/^Cake/)
    await user.keyboard('{ArrowUp}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('dirty-water')
  })

  it('selects Empty', async () => {
    const { user, onSelect } = setup()
    await user.keyboard('{Home} ')
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('closes on Escape and traps Tab', async () => {
    const { user, onClose } = setup()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('listbox')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('picks an icon into a slot and returns focus to it', async () => {
    const user = userEvent.setup()
    renderWithTextures(<Editor onChangeTextures={() => {}} />)
    const slot = screen.getByRole('button', { name: /^Slot 1:/ })
    await user.click(slot)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /^Turret Hazard/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Slot 1: Turret Hazard, active/ }),
    ).toHaveFocus()

    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Slot 1:/ })).toHaveFocus()
  })
})

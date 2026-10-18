import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChamberFields } from './ChamberFields'

describe('ChamberFields', () => {
  it('uses number inputs with per-field ranges', () => {
    render(<ChamberFields current={4} total={19} onChange={() => {}} />)
    const current = screen.getByRole('spinbutton', { name: 'Chamber number' })
    const total = screen.getByRole('spinbutton', { name: 'Total chambers' })
    expect(current).toHaveAttribute('type', 'number')
    expect(current).toHaveAttribute('min', '0')
    expect(total).toHaveAttribute('min', '1')
    expect(total).toHaveAttribute('max', '98')
    expect(current).toHaveValue(4)
  })

  it('accepts chamber 00 and zero-pads on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChamberFields current={4} total={19} onChange={onChange} />)
    const current = screen.getByRole('spinbutton', { name: 'Chamber number' })

    await user.clear(current)
    await user.type(current, '0')
    expect(onChange).toHaveBeenLastCalledWith(0, 19)
    await user.tab()
    expect(screen.getByRole('status')).toHaveTextContent('00 / 19')
  })

  it('shows an error and does not commit when chamber exceeds total', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChamberFields current={4} total={19} onChange={onChange} />)
    const current = screen.getByRole('spinbutton', { name: 'Chamber number' })

    await user.clear(current)
    await user.type(current, '25')
    expect(current).toHaveAttribute('aria-invalid', 'true')
    expect(current).toHaveAccessibleDescription(/greater than the total/)
    expect(onChange).not.toHaveBeenCalledWith(25, 19)
  })
})

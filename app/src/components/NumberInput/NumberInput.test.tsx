import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import NumberInput from './NumberInput'

describe('NumberInput', () => {
  it('fires onChange with a numeric value', () => {
    const onChange = vi.fn()
    render(<NumberInput value={1} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } })
    expect(onChange).toHaveBeenCalledWith(42)
  })

  it('ignores a cleared (NaN) value', () => {
    const onChange = vi.fn()
    render(<NumberInput value={1} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
  })
})

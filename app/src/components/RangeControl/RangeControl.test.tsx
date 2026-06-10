import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import RangeControl from './RangeControl'

describe('RangeControl', () => {
  it('keeps slider and number in sync and fires onChange from both', () => {
    const onChange = vi.fn()
    render(<RangeControl value={10} min={0} max={100} onChange={onChange} />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    const number = screen.getByRole('spinbutton') as HTMLInputElement
    expect(slider.value).toBe('10')
    expect(number.value).toBe('10')

    fireEvent.change(slider, { target: { value: '20' } })
    expect(onChange).toHaveBeenLastCalledWith(20)

    fireEvent.change(number, { target: { value: '30' } })
    expect(onChange).toHaveBeenLastCalledWith(30)
  })
})

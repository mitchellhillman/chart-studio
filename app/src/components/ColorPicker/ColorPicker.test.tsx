import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import ColorPicker from './ColorPicker'

describe('ColorPicker', () => {
  it('commits a valid hex on blur', () => {
    const onChange = vi.fn()
    render(<ColorPicker id="bg" value="#ffffff" onChange={onChange} />)
    const hex = screen.getByLabelText('color swatch').nextElementSibling as HTMLInputElement
    fireEvent.change(hex, { target: { value: '21409A' } })
    fireEvent.blur(hex)
    expect(onChange).toHaveBeenCalledWith('#21409A')
  })

  it('rejects an invalid hex and reverts', () => {
    const onChange = vi.fn()
    render(<ColorPicker id="bg" value="#ffffff" onChange={onChange} />)
    const hex = screen.getByLabelText('color swatch').nextElementSibling as HTMLInputElement
    fireEvent.change(hex, { target: { value: 'nothex' } })
    fireEvent.blur(hex)
    expect(onChange).not.toHaveBeenCalled()
    expect(hex.value).toBe('#ffffff')
  })
})

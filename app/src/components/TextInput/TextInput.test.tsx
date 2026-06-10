import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextInput from './TextInput'

describe('TextInput', () => {
  it('fires onChange with the typed value', async () => {
    const onChange = vi.fn()
    render(<TextInput id="t" value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'x')
    expect(onChange).toHaveBeenCalledWith('x')
  })
})

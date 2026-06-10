import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextArea from './TextArea'

describe('TextArea', () => {
  it('fires onChange with the typed value', async () => {
    const onChange = vi.fn()
    render(<TextArea id="s" value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'y')
    expect(onChange).toHaveBeenCalledWith('y')
  })
})

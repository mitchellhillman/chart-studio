import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkbox from './Checkbox'

describe('Checkbox', () => {
  it('fires onChange with the new checked state', async () => {
    const onChange = vi.fn()
    render(<Checkbox id="c" label="Show legend" checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Show legend'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

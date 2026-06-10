import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from './Select'

const options = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
]

describe('Select', () => {
  it('renders its options and fires onChange with the chosen value', async () => {
    const onChange = vi.fn()
    render(<Select value="bar" onChange={onChange} options={options} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'line')
    expect(onChange).toHaveBeenCalledWith('line')
  })
})

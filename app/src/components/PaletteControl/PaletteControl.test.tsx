import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaletteControl from './PaletteControl'

const options = [
  { value: 'economist', label: 'Economist' },
  { value: 'warm', label: 'Warm' },
]

describe('PaletteControl', () => {
  it('fires onChange when a palette is selected', async () => {
    const onChange = vi.fn()
    render(
      <PaletteControl options={options} value="economist" onChange={onChange} onSave={vi.fn()} />,
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), 'warm')
    expect(onChange).toHaveBeenCalledWith('warm')
  })

  it('saves a named palette and clears the field', async () => {
    const onSave = vi.fn()
    render(
      <PaletteControl options={options} value="economist" onChange={vi.fn()} onSave={onSave} />,
    )
    const name = screen.getByLabelText('Palette name')
    await userEvent.type(name, 'My palette')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('My palette')
    expect(name).toHaveValue('')
  })

  it('does not save a blank name', async () => {
    const onSave = vi.fn()
    render(
      <PaletteControl options={options} value="economist" onChange={vi.fn()} onSave={onSave} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).not.toHaveBeenCalled()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FontControl from './FontControl'
import { FONT_OPTIONS } from '../../lib/fonts'

describe('FontControl', () => {
  it('renders every font option', () => {
    render(<FontControl value={FONT_OPTIONS[0].value} onChange={vi.fn()} />)
    expect(screen.getAllByRole('option')).toHaveLength(FONT_OPTIONS.length)
  })

  it('fires onChange with the chosen font stack', async () => {
    const onChange = vi.fn()
    render(<FontControl value={FONT_OPTIONS[0].value} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), FONT_OPTIONS[1].value)
    expect(onChange).toHaveBeenCalledWith(FONT_OPTIONS[1].value)
  })
})

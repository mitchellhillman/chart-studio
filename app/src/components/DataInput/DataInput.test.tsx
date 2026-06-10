import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataInput from './DataInput'

describe('DataInput', () => {
  it('fires onChange when the JSON is edited', () => {
    const onChange = vi.fn()
    render(<DataInput value="{}" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '{"a":1}' } })
    expect(onChange).toHaveBeenCalledWith('{"a":1}')
  })

  it('surfaces an error via an alert', () => {
    render(<DataInput value="{" onChange={vi.fn()} error="Unexpected end of JSON" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected end of JSON')
  })

  it('calls onFile when a file is chosen', async () => {
    const onFile = vi.fn()
    render(<DataInput value="" onChange={vi.fn()} onFile={onFile} />)
    const file = new File(['{}'], 'chart.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Upload JSON file'), file)
    expect(onFile).toHaveBeenCalledWith(file)
  })
})

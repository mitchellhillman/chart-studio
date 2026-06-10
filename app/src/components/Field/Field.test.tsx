import { render, screen } from '@testing-library/react'
import Field from './Field'

describe('Field', () => {
  it('ties its label to the control and renders help text', () => {
    render(
      <Field label="Title" htmlFor="t" help="hint">
        <input id="t" />
      </Field>,
    )
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByText('hint')).toBeInTheDocument()
  })
})

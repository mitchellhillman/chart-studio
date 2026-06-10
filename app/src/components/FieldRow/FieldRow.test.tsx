import { render, screen } from '@testing-library/react'
import FieldRow from './FieldRow'

describe('FieldRow', () => {
  it('renders its children', () => {
    render(
      <FieldRow>
        <span>a</span>
        <span>b</span>
      </FieldRow>,
    )
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
  })
})

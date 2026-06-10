import { render, screen } from '@testing-library/react'
import ControlPanel from './ControlPanel'

describe('ControlPanel', () => {
  it('renders its children', () => {
    render(
      <ControlPanel>
        <span>group</span>
      </ControlPanel>,
    )
    expect(screen.getByText('group')).toBeInTheDocument()
  })
})

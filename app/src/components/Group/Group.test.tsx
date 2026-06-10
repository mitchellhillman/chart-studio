import { render, screen } from '@testing-library/react'
import Group from './Group'

describe('Group', () => {
  it('renders its title and children', () => {
    render(
      <Group title="Colors">
        <span>inner</span>
      </Group>,
    )
    expect(screen.getByRole('heading', { name: 'Colors' })).toBeInTheDocument()
    expect(screen.getByText('inner')).toBeInTheDocument()
  })

  it('omits the heading when no title', () => {
    render(
      <Group>
        <span>inner</span>
      </Group>,
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

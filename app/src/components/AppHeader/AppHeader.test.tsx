import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppHeader from './AppHeader'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppHeader />
    </MemoryRouter>,
  )
}

describe('AppHeader', () => {
  it('renders both nav links', () => {
    renderAt('/gantt')
    expect(screen.getByRole('link', { name: 'Gantt' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bar/Line' })).toBeInTheDocument()
  })

  it('marks the Gantt link active on the gantt route', () => {
    renderAt('/gantt')
    expect(screen.getByRole('link', { name: 'Gantt' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the Bar/Line link active on the bar route', () => {
    renderAt('/bar')
    expect(screen.getByRole('link', { name: 'Bar/Line' })).toHaveAttribute('aria-current', 'page')
  })
})

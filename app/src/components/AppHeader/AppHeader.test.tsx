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

  it('points Bar/Line at the legacy site', () => {
    renderAt('/gantt')
    expect(screen.getByRole('link', { name: 'Bar/Line' })).toHaveAttribute('href', '../')
  })
})

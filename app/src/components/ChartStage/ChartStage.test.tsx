import { render, screen } from '@testing-library/react'
import ChartStage from './ChartStage'

describe('ChartStage', () => {
  it('renders chart content and an optional footer', () => {
    render(
      <ChartStage footer={<div>toolbar</div>}>
        <svg data-testid="chart" />
      </ChartStage>,
    )
    expect(screen.getByTestId('chart')).toBeInTheDocument()
    expect(screen.getByText('toolbar')).toBeInTheDocument()
  })
})

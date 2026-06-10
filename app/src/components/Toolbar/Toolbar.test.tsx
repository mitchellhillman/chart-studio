import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar'

function setup(status?: string) {
  const handlers = {
    onCopySvg: vi.fn(),
    onDownloadSvg: vi.fn(),
    onSaveJson: vi.fn(),
    onLoadJson: vi.fn(),
    onReset: vi.fn(),
    onShare: vi.fn(),
  }
  render(<Toolbar {...handlers} status={status} />)
  return handlers
}

describe('Toolbar', () => {
  it('invokes each action button', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Copy SVG' }))
    await userEvent.click(screen.getByRole('button', { name: 'Download SVG' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(h.onCopySvg).toHaveBeenCalled()
    expect(h.onDownloadSvg).toHaveBeenCalled()
    expect(h.onSaveJson).toHaveBeenCalled()
    expect(h.onReset).toHaveBeenCalled()
    expect(h.onShare).toHaveBeenCalled()
  })

  it('routes a chosen file to onLoadJson', async () => {
    const h = setup()
    const file = new File(['{}'], 'chart.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Load JSON file'), file)
    expect(h.onLoadJson).toHaveBeenCalledWith(file)
  })

  it('shows the status flash', () => {
    setup('copied')
    expect(screen.getByRole('status')).toHaveTextContent('copied')
  })
})

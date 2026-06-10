import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import Toolbar from './Toolbar'

const meta: Meta<typeof Toolbar> = {
  title: 'Controls/Toolbar',
  component: Toolbar,
  args: {
    onCopySvg: fn(),
    onDownloadSvg: fn(),
    onSaveJson: fn(),
    onLoadJson: fn(),
    onReset: fn(),
    onShare: fn(),
  },
}
export default meta
type Story = StoryObj<typeof Toolbar>

export const Default: Story = {}
export const WithStatusFlash: Story = { args: { status: 'copied svg' } }

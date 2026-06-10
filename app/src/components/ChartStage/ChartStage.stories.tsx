import type { Meta, StoryObj } from '@storybook/react'
import ChartStage from './ChartStage'

const meta: Meta<typeof ChartStage> = {
  title: 'Layout/ChartStage',
  component: ChartStage,
}
export default meta
type Story = StoryObj<typeof ChartStage>

export const Default: Story = {
  args: {
    children: (
      <svg width={320} height={160} role="img" aria-label="placeholder chart">
        <rect width={320} height={160} fill="#fff" />
        <rect x={20} y={40} width={200} height={16} fill="#21409A" />
        <rect x={20} y={70} width={120} height={16} fill="#A3C2E3" />
      </svg>
    ),
  },
}

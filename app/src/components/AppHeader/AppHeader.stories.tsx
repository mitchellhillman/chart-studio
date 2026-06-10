import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import AppHeader from './AppHeader'

const meta: Meta<typeof AppHeader> = {
  title: 'Shell/AppHeader',
  component: AppHeader,
  parameters: { backgrounds: { default: 'panel' } },
  decorators: [
    (Story, ctx) => (
      <MemoryRouter initialEntries={[(ctx.parameters.route as string) ?? '/gantt']}>
        <Story />
      </MemoryRouter>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof AppHeader>

export const GanttActive: Story = { parameters: { route: '/gantt' } }
export const NeitherActive: Story = { parameters: { route: '/other' } }

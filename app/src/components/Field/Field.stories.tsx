import type { Meta, StoryObj } from '@storybook/react'
import Field from './Field'

const meta: Meta<typeof Field> = {
  title: 'Layout/Field',
  component: Field,
}
export default meta
type Story = StoryObj<typeof Field>

export const WithLabel: Story = {
  args: { label: 'Title', htmlFor: 'f', children: <input id="f" /> },
}

export const WithHelp: Story = {
  args: {
    label: 'Axis labels shown',
    htmlFor: 'f2',
    help: '0 = all, min first + last',
    children: <input id="f2" type="number" />,
  },
}

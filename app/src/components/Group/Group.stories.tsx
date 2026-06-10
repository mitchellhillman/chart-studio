import type { Meta, StoryObj } from '@storybook/react'
import Group from './Group'
import Field from '../Field/Field'

const meta: Meta<typeof Group> = {
  title: 'Layout/Group',
  component: Group,
}
export default meta
type Story = StoryObj<typeof Group>

export const ColorsGroup: Story = {
  args: {
    title: 'Colors',
    children: (
      <>
        <Field label="Background" htmlFor="bg">
          <input id="bg" defaultValue="#ffffff" />
        </Field>
        <Field label="Legend background" htmlFor="lbg">
          <input id="lbg" defaultValue="#ffffff" />
        </Field>
      </>
    ),
  },
}

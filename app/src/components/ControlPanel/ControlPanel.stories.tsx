import type { Meta, StoryObj } from '@storybook/react'
import ControlPanel from './ControlPanel'
import Group from '../Group/Group'
import Field from '../Field/Field'

const meta: Meta<typeof ControlPanel> = {
  title: 'Layout/ControlPanel',
  component: ControlPanel,
}
export default meta
type Story = StoryObj<typeof ControlPanel>

export const Default: Story = {
  args: {
    children: (
      <>
        <Group title="Text">
          <Field label="Title" htmlFor="t">
            <input id="t" defaultValue="Presidents" />
          </Field>
        </Group>
        <Group title="Size">
          <Field label="Width" htmlFor="w">
            <input id="w" type="number" defaultValue={900} />
          </Field>
        </Group>
      </>
    ),
  },
}

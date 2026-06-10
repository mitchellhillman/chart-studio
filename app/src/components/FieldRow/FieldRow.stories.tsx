import type { Meta, StoryObj } from '@storybook/react'
import FieldRow from './FieldRow'
import Field from '../Field/Field'

const meta: Meta<typeof FieldRow> = {
  title: 'Layout/FieldRow',
  component: FieldRow,
}
export default meta
type Story = StoryObj<typeof FieldRow>

export const TwoControls: Story = {
  args: {
    children: (
      <>
        <Field label="Chart type" htmlFor="t">
          <select id="t">
            <option>Bar</option>
            <option>Line</option>
          </select>
        </Field>
        <Field label="Orientation" htmlFor="o">
          <select id="o">
            <option>Vertical</option>
            <option>Horizontal</option>
          </select>
        </Field>
      </>
    ),
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import RangeControl from './RangeControl'
import Field from '../Field/Field'

const meta: Meta<typeof RangeControl> = {
  title: 'Controls/RangeControl',
  component: RangeControl,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Range" htmlFor="rc">
          <RangeControl {...args} id="rc" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof RangeControl>

export const Width: Story = { args: { value: 900, min: 100, max: 2000, step: 10 } }
export const RowHeight: Story = { args: { value: 22, min: 8, max: 80, step: 1 } }

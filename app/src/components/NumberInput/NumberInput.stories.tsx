import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import NumberInput from './NumberInput'
import Field from '../Field/Field'

const meta: Meta<typeof NumberInput> = {
  title: 'Controls/NumberInput',
  component: NumberInput,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Number" htmlFor="ni">
          <NumberInput {...args} id="ni" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof NumberInput>

export const TickCount: Story = { args: { value: 6, min: 2, max: 20, step: 1 } }
export const RowHeight: Story = { args: { value: 22, min: 8, max: 80, step: 1 } }
export const Width: Story = { args: { value: 900, min: 100, max: 2000, step: 10 } }

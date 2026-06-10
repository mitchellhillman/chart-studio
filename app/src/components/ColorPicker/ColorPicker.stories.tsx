import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import ColorPicker from './ColorPicker'
import Field from '../Field/Field'

const meta: Meta<typeof ColorPicker> = {
  title: 'Controls/ColorPicker',
  component: ColorPicker,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Color" htmlFor="cp">
          <ColorPicker {...args} id="cp" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof ColorPicker>

export const Background: Story = { args: { value: '#ffffff' } }
export const LegendBackground: Story = { args: { value: '#f6f7f8' } }
export const CategoryColor: Story = { args: { value: '#21409A' } }

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import Select from './Select'
import Field from '../Field/Field'

const meta: Meta<typeof Select> = {
  title: 'Controls/Select',
  component: Select,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Select" htmlFor="sel">
          <Select {...args} id="sel" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof Select>

export const ChartType: Story = {
  args: {
    value: 'bar',
    options: [
      { value: 'bar', label: 'Bar' },
      { value: 'line', label: 'Line' },
    ],
  },
}

export const Orientation: Story = {
  args: {
    value: 'vertical',
    options: [
      { value: 'vertical', label: 'Vertical' },
      { value: 'horizontal', label: 'Horizontal' },
    ],
  },
}

export const LegendPosition: Story = {
  args: {
    value: 'top-left',
    options: [
      { value: 'top-left', label: 'Top left' },
      { value: 'top-right', label: 'Top right' },
      { value: 'bottom-left', label: 'Bottom left' },
      { value: 'bottom-right', label: 'Bottom right' },
    ],
  },
}

export const DataMode: Story = {
  args: {
    value: 'paste',
    options: [
      { value: 'paste', label: 'Paste' },
      { value: 'file', label: 'Upload file' },
    ],
  },
}

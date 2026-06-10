import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import TextArea from './TextArea'
import Field from '../Field/Field'

const meta: Meta<typeof TextArea> = {
  title: 'Controls/TextArea',
  component: TextArea,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Source (one line per row)" htmlFor="ta">
          <TextArea {...args} id="ta" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof TextArea>

export const Source: Story = {
  args: { value: 'Source: National WWII Museum', rows: 4 },
}

export const DataJson: Story = {
  args: { value: '{\n  "version": 1\n}', rows: 12, mono: true },
}

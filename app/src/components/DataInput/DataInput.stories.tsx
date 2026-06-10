import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { fn } from '@storybook/test'
import DataInput from './DataInput'
import Field from '../Field/Field'

const SAMPLE = JSON.stringify(
  { version: 1, kind: 'gantt', data: { rows: [{ label: 'Row', segments: [] }] } },
  null,
  2,
)

const meta: Meta<typeof DataInput> = {
  title: 'Controls/DataInput',
  component: DataInput,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Data (JSON)" htmlFor="di">
          <DataInput {...args} id="di" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof DataInput>

export const Valid: Story = { args: { value: SAMPLE } }
export const InvalidJson: Story = {
  args: { value: '{ "rows": [', error: 'Unexpected end of JSON input' },
}
export const FileUpload: Story = {
  args: { value: SAMPLE, filename: 'presidents.json', onFile: fn() },
}

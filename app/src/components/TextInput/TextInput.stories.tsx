import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import TextInput from './TextInput'
import Field from '../Field/Field'

const meta: Meta<typeof TextInput> = {
  title: 'Controls/TextInput',
  component: TextInput,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label={args.placeholder ?? 'Title'} htmlFor="ti">
          <TextInput {...args} id="ti" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof TextInput>

export const Title: Story = { args: { value: 'WWII U.S. military deaths', placeholder: 'Title' } }
export const Subtitle: Story = { args: { value: 'by theater', placeholder: 'Subtitle' } }
export const Eyebrow: Story = { args: { value: 'UNITED STATES', placeholder: 'Eyebrow' } }

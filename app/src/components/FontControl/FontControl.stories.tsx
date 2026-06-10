import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import FontControl from './FontControl'
import { DEFAULT_FONT } from '../../lib/fonts'
import Field from '../Field/Field'

const meta: Meta<typeof FontControl> = {
  title: 'Controls/FontControl',
  component: FontControl,
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Font" htmlFor="fc">
          <FontControl {...args} id="fc" value={value} onChange={setValue} />
        </Field>
        <p style={{ fontFamily: value, fontSize: 18 }}>The quick brown fox — 1234</p>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof FontControl>

export const Default: Story = { args: { value: DEFAULT_FONT } }

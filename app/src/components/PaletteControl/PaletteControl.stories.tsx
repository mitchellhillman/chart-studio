import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { fn } from '@storybook/test'
import PaletteControl from './PaletteControl'
import Field from '../Field/Field'

const meta: Meta<typeof PaletteControl> = {
  title: 'Controls/PaletteControl',
  component: PaletteControl,
  args: { onSave: fn() },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ width: 340 }}>
        <Field label="Palette" htmlFor="pc">
          <PaletteControl {...args} id="pc" value={value} onChange={setValue} />
        </Field>
      </div>
    )
  },
}
export default meta
type Story = StoryObj<typeof PaletteControl>

export const Default: Story = {
  args: {
    value: 'economist',
    options: [
      { value: 'economist', label: 'Economist' },
      { value: 'economist-warm', label: 'Economist warm' },
      { value: 'monochrome', label: 'Monochrome' },
      { value: 'custom', label: 'Custom' },
    ],
  },
}

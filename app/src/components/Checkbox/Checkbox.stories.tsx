import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import Checkbox from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Controls/Checkbox',
  component: Checkbox,
  render: (args) => {
    const [checked, setChecked] = useState(args.checked)
    return <Checkbox {...args} checked={checked} onChange={setChecked} />
  },
}
export default meta
type Story = StoryObj<typeof Checkbox>

export const ShowLegend: Story = { args: { label: 'Show legend', checked: true, id: 'sl' } }
export const ShowTopAxis: Story = { args: { label: 'Show top axis', checked: true, id: 'sta' } }
export const ShowBottomAxis: Story = {
  args: { label: 'Show bottom axis', checked: false, id: 'sba' },
}

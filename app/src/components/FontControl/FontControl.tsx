import Select from '../Select/Select'
import { FONT_OPTIONS } from '../../lib/fonts'

export interface FontControlProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

export default function FontControl({ value, onChange, id }: FontControlProps) {
  return <Select id={id} value={value} onChange={onChange} options={FONT_OPTIONS} />
}

import { useState } from 'react'
import Select, { type SelectOption } from '../Select/Select'
import styles from './PaletteControl.module.css'

export interface PaletteControlProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  onSave: (name: string) => void
  id?: string
}

export default function PaletteControl({
  options,
  value,
  onChange,
  onSave,
  id,
}: PaletteControlProps) {
  const [name, setName] = useState('')

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  return (
    <div>
      <Select id={id} value={value} onChange={onChange} options={options} />
      <div className={styles.saveRow}>
        <input
          type="text"
          value={name}
          placeholder="Palette name"
          aria-label="Palette name"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}

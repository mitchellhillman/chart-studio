import { useEffect, useState } from 'react'
import { normalizeHex } from '../../lib/color'
import styles from './ColorPicker.module.css'

export interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  id?: string
  placeholder?: string
}

export default function ColorPicker({ value, onChange, id, placeholder = '#ffffff' }: ColorPickerProps) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  const commit = () => {
    const hex = normalizeHex(text)
    if (hex) {
      onChange(hex)
      setText(hex)
    } else {
      setText(value)
    }
  }

  const swatchValue = normalizeHex(value) ?? '#ffffff'

  return (
    <div className={styles.row}>
      <input
        type="color"
        className={styles.swatch}
        value={swatchValue}
        onChange={(e) => onChange(e.target.value)}
        aria-label="color swatch"
      />
      <input
        type="text"
        id={id}
        className={styles.hex}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
      />
    </div>
  )
}

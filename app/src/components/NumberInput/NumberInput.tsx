import styles from './NumberInput.module.css'

export interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  min?: number
  max?: number
  step?: number
}

export default function NumberInput({ value, onChange, id, min, max, step }: NumberInputProps) {
  return (
    <input
      type="number"
      id={id}
      className={styles.num}
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = e.target.valueAsNumber
        if (!Number.isNaN(n)) onChange(n)
      }}
    />
  )
}

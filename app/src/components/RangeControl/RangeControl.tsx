import styles from './RangeControl.module.css'

export interface RangeControlProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  id?: string
}

export default function RangeControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  id,
}: RangeControlProps) {
  const emit = (raw: number) => {
    if (!Number.isNaN(raw)) onChange(raw)
  }
  return (
    <div className={styles.row}>
      <input
        type="range"
        id={id ? `${id}-range` : undefined}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => emit(e.target.valueAsNumber)}
      />
      <input
        type="number"
        id={id}
        className={styles.number}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => emit(e.target.valueAsNumber)}
      />
    </div>
  )
}

import styles from './Checkbox.module.css'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  disabled?: boolean
}

export default function Checkbox({ checked, onChange, label, id, disabled }: CheckboxProps) {
  return (
    <label className={styles.label} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

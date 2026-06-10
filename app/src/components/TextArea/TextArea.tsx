import styles from './TextArea.module.css'

export interface TextAreaProps {
  value: string
  onChange: (value: string) => void
  id?: string
  rows?: number
  placeholder?: string
  mono?: boolean
}

export default function TextArea({
  value,
  onChange,
  id,
  rows = 4,
  placeholder,
  mono,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      className={mono ? styles.mono : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

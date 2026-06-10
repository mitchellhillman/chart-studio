import styles from './TextInput.module.css'

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  mono?: boolean
}

export default function TextInput({ value, onChange, id, placeholder, mono }: TextInputProps) {
  return (
    <input
      type="text"
      id={id}
      value={value}
      placeholder={placeholder}
      className={mono ? styles.mono : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

import styles from './DataInput.module.css'

export interface DataInputProps {
  value: string
  onChange: (value: string) => void
  error?: string | null
  rows?: number
  id?: string
  filename?: string
  onFile?: (file: File) => void
}

export default function DataInput({
  value,
  onChange,
  error,
  rows = 14,
  id,
  filename,
  onFile,
}: DataInputProps) {
  return (
    <div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        className={error ? `${styles.editor} ${styles.invalid}` : styles.editor}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {onFile && (
        <div className={styles.fileRow}>
          {filename && <p className={styles.filename}>{filename}</p>}
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Upload JSON file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
            }}
          />
        </div>
      )}
    </div>
  )
}

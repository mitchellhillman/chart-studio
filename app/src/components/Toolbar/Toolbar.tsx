import { useRef } from 'react'
import styles from './Toolbar.module.css'

export interface ToolbarProps {
  onCopySvg: () => void
  onDownloadSvg: () => void
  onSaveJson: () => void
  onLoadJson: (file: File) => void
  onReset: () => void
  onShare: () => void
  status?: string
}

export default function Toolbar({
  onCopySvg,
  onDownloadSvg,
  onSaveJson,
  onLoadJson,
  onReset,
  onShare,
  status,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.toolbar}>
      <button type="button" onClick={onCopySvg}>
        Copy SVG
      </button>
      <button type="button" onClick={onDownloadSvg}>
        Download SVG
      </button>
      <button type="button" onClick={onSaveJson}>
        Save JSON
      </button>
      <button type="button" onClick={() => fileRef.current?.click()}>
        Load JSON
      </button>
      <button type="button" onClick={onReset}>
        Reset
      </button>
      <button type="button" onClick={onShare}>
        Share
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        aria-label="Load JSON file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onLoadJson(file)
          e.target.value = ''
        }}
      />
      <span className={styles.status} role="status">
        {status}
      </span>
    </div>
  )
}

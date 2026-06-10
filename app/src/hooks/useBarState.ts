import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_BAR_CONFIG, DEFAULT_BAR_CSV, mergeBarConfig } from '../charts/bar/defaults'
import type { BarConfig } from '../charts/bar/types'
import { decodeBarState, type BarDoc } from '../lib/barIo'
import { parseData, type DataRow } from '../lib/parse'
import { clearBar, persistBar, restoreBar } from '../lib/persistence'

export interface BarState {
  ready: boolean
  config: BarConfig
  csv: string
  rows: DataRow[]
  updateConfig: (patch: Partial<BarConfig>) => void
  setCsv: (csv: string) => void
  loadDoc: (doc: BarDoc) => void
  reset: () => void
  doc: BarDoc
}

export function useBarState(sharedParam?: string | null): BarState {
  const [config, setConfig] = useState<BarConfig>(DEFAULT_BAR_CONFIG)
  const [csv, setCsv] = useState(DEFAULT_BAR_CSV)
  const [ready, setReady] = useState(false)
  const initialized = useRef(false)

  const rows = useMemo(() => parseData(csv), [csv])

  const applyDoc = useCallback((doc: BarDoc) => {
    setConfig(mergeBarConfig(doc.config))
    setCsv(doc.csv)
  }, [])

  // Load precedence: ?s= share link → bar:autosave → bundled default.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const shared = sharedParam ? decodeBarState(sharedParam) : null
    if (shared) {
      applyDoc(shared)
      setReady(true)
      return
    }
    const restored = restoreBar()
    if (restored) {
      setConfig(mergeBarConfig(restored.config as Partial<BarConfig>))
      setCsv(restored.csv)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autosave.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => persistBar(config as unknown as Record<string, unknown>, csv), 400)
    return () => clearTimeout(t)
  }, [config, csv, ready])

  const updateConfig = useCallback((patch: Partial<BarConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  const reset = useCallback(() => {
    clearBar()
    setConfig(DEFAULT_BAR_CONFIG)
    setCsv(DEFAULT_BAR_CSV)
  }, [])

  const doc: BarDoc = { version: 1, kind: 'bar', config, csv }

  return { ready, config, csv, rows, updateConfig, setCsv, loadDoc: applyDoc, reset, doc }
}

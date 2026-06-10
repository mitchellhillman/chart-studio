import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mergeConfig } from '../charts/gantt/defaults'
import type { GanttConfig } from '../charts/gantt/types'
import { parseGanttDoc, type GanttDoc, type GanttModel } from '../lib/ganttDoc'
import { clearGantt, persistGantt, restoreGantt } from '../lib/persistence'
import { decodeState } from '../lib/shareState'

export const DEFAULT_PRESET = 'presidents'

const presetUrl = (name: string) => `${import.meta.env.BASE_URL}presets/${name}.json`

export interface DerivedData {
  model: GanttModel | null
  dataError: string | null
}

// Parse the edited `data` JSON and validate its rows/segments.
export function deriveModel(dataText: string): DerivedData {
  let parsed: unknown
  try {
    parsed = JSON.parse(dataText)
  } catch (err) {
    return { model: null, dataError: (err as Error).message }
  }
  const result = parseGanttDoc({ data: parsed })
  if (!result.ok || !result.value) {
    return { model: null, dataError: result.errors.map((e) => `${e.path}: ${e.message}`).join('\n') }
  }
  return { model: result.value.data, dataError: null }
}

export interface SavedDoc {
  version: number
  kind: 'gantt'
  config: GanttConfig
  data: GanttModel
}

export interface ChartState {
  ready: boolean
  config: GanttConfig
  dataText: string
  model: GanttModel | null
  dataError: string | null
  updateConfig: (patch: Partial<GanttConfig>) => void
  setDataText: (text: string) => void
  loadDoc: (doc: GanttDoc) => void
  loadPreset: (name: string) => Promise<void>
  reset: () => Promise<void>
  doc: SavedDoc | null
}

export function useChartState(sharedParam?: string | null): ChartState {
  const [config, setConfig] = useState<GanttConfig>(mergeConfig(null))
  const [dataText, setDataText] = useState('{\n  "rows": []\n}')
  const [ready, setReady] = useState(false)
  const initialized = useRef(false)

  const { model, dataError } = useMemo(() => deriveModel(dataText), [dataText])

  const applyDoc = useCallback((doc: GanttDoc) => {
    setConfig(mergeConfig(doc.config))
    setDataText(JSON.stringify(doc.data, null, 2))
  }, [])

  const fetchPreset = useCallback(async (name: string): Promise<GanttDoc | null> => {
    try {
      const text = await fetch(presetUrl(name)).then((r) => r.text())
      const result = parseGanttDoc(text)
      return result.ok ? result.value : null
    } catch {
      return null
    }
  }, [])

  // Load precedence: ?s= share link → autosave → bundled default preset.
  // Runs exactly once; the init guard keeps a later sharedParam clear from
  // re-triggering and clobbering the loaded document.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let cancelled = false

    const shared = sharedParam ? decodeState(sharedParam) : null
    if (shared) {
      applyDoc(shared)
      setReady(true)
      return
    }

    const restored = restoreGantt()
    if (restored) {
      setConfig(mergeConfig(restored.config))
      setDataText(JSON.stringify(restored.data, null, 2))
      setReady(true)
      return
    }

    fetchPreset(DEFAULT_PRESET).then((doc) => {
      if (cancelled) return
      if (doc) applyDoc(doc)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autosave (only when the data JSON is valid).
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      try {
        persistGantt(config, JSON.parse(dataText))
      } catch {
        /* invalid JSON in flight; skip this autosave tick */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [config, dataText, ready])

  const updateConfig = useCallback((patch: Partial<GanttConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  const loadPreset = useCallback(
    async (name: string) => {
      const doc = await fetchPreset(name)
      if (doc) applyDoc(doc)
    },
    [applyDoc, fetchPreset],
  )

  const reset = useCallback(async () => {
    clearGantt()
    const doc = await fetchPreset(DEFAULT_PRESET)
    if (doc) applyDoc(doc)
  }, [applyDoc, fetchPreset])

  const doc: SavedDoc | null = model ? { version: 1, kind: 'gantt', config, data: model } : null

  return {
    ready,
    config,
    dataText,
    model,
    dataError,
    updateConfig,
    setDataText,
    loadDoc: applyDoc,
    loadPreset,
    reset,
    doc,
  }
}

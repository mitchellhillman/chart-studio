import { beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { deriveModel, useChartState } from './useChartState'
import { AUTOSAVE_KEY } from '../lib/persistence'
import { encodeState } from '../lib/shareState'

describe('deriveModel', () => {
  it('parses valid data JSON into a model', () => {
    const { model, dataError } = deriveModel('{"rows":[{"label":"r","segments":[{"start":1,"end":2}]}]}')
    expect(dataError).toBeNull()
    expect(model?.rows).toHaveLength(1)
  })

  it('reports malformed JSON', () => {
    const { model, dataError } = deriveModel('{ not json')
    expect(model).toBeNull()
    expect(dataError).toBeTruthy()
  })

  it('reports a validation error with a contextual path', () => {
    const { dataError } = deriveModel('{"rows":[{"label":"r","segments":[{"category":"a"}]}]}')
    expect(dataError).toContain('segments[0].start')
  })
})

describe('useChartState', () => {
  beforeEach(() => localStorage.clear())

  it('restores from autosave ahead of fetching a preset', async () => {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({
        version: 1,
        kind: 'gantt',
        config: { title: 'Restored' },
        data: { rows: [{ label: 'r', segments: [{ start: 0, end: 1 }] }] },
      }),
    )
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { result } = renderHook(() => useChartState())
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.config.title).toBe('Restored')
    expect(result.current.model?.rows).toHaveLength(1)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('loads a ?s= share link ahead of autosave', async () => {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ version: 1, kind: 'gantt', config: { title: 'Autosaved' }, data: { rows: [] } }),
    )
    const shared = encodeState({
      version: 1,
      kind: 'gantt',
      config: { title: 'Shared' },
      data: { rows: [{ label: 'r', segments: [{ start: 0, end: 1 }] }] },
    })
    const { result } = renderHook(() => useChartState(shared))
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.config.title).toBe('Shared')
    expect(result.current.model?.rows).toHaveLength(1)
  })

  it('merges config patches and re-derives the model on data edits', async () => {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({
        version: 1,
        kind: 'gantt',
        config: { title: 'A' },
        data: { rows: [] },
      }),
    )
    const { result } = renderHook(() => useChartState())
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.updateConfig({ width: 1234 }))
    expect(result.current.config.width).toBe(1234)

    act(() => result.current.setDataText('{ broken'))
    expect(result.current.dataError).toBeTruthy()
    expect(result.current.model).toBeNull()
  })
})

import { beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useBarState } from './useBarState'
import { BAR_AUTOSAVE_KEY } from '../lib/persistence'
import { encodeBarState } from '../lib/barIo'

describe('useBarState', () => {
  beforeEach(() => localStorage.clear())

  it('falls back to the bundled default when nothing is stored', async () => {
    const { result } = renderHook(() => useBarState())
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.rows.length).toBeGreaterThan(0)
  })

  it('restores from bar:autosave', async () => {
    localStorage.setItem(
      BAR_AUTOSAVE_KEY,
      JSON.stringify({ version: 1, kind: 'bar', config: { title: 'Saved' }, csv: 'label,A\nX,1' }),
    )
    const { result } = renderHook(() => useBarState())
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.config.title).toBe('Saved')
    expect(result.current.rows).toHaveLength(1)
  })

  it('loads a ?s= share link ahead of autosave', async () => {
    localStorage.setItem(
      BAR_AUTOSAVE_KEY,
      JSON.stringify({ version: 1, kind: 'bar', config: { title: 'Autosaved' }, csv: 'label,A\nX,1' }),
    )
    const shared = encodeBarState({
      version: 1,
      kind: 'bar',
      config: { title: 'Shared' },
      csv: 'label,A\nY,2\nZ,3',
    })
    const { result } = renderHook(() => useBarState(shared))
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.config.title).toBe('Shared')
    expect(result.current.rows).toHaveLength(2)
  })

  it('updates config and re-parses CSV on edits', async () => {
    const { result } = renderHook(() => useBarState())
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.updateConfig({ chartType: 'line' }))
    expect(result.current.config.chartType).toBe('line')
    act(() => result.current.setCsv('label,A\nOnly,5'))
    expect(result.current.rows).toHaveLength(1)
  })
})

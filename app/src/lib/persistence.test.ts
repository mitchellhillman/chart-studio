import { beforeEach } from 'vitest'
import { AUTOSAVE_KEY, clearGantt, persistGantt, restoreGantt } from './persistence'
import { mergeConfig } from '../charts/gantt/defaults'

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips config + data through localStorage', () => {
    const config = mergeConfig({ title: 'X', width: 1000 })
    const data = { rows: [{ label: 'r', segments: [{ start: 1, end: 2 }] }] }
    persistGantt(config, data)
    const restored = restoreGantt()
    expect(restored?.config.title).toBe('X')
    expect(restored?.data).toEqual(data)
  })

  it('returns null when nothing is stored', () => {
    expect(restoreGantt()).toBeNull()
  })

  it('returns null for corrupt or incomplete payloads', () => {
    localStorage.setItem(AUTOSAVE_KEY, 'not json')
    expect(restoreGantt()).toBeNull()
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ config: {} }))
    expect(restoreGantt()).toBeNull()
  })

  it('clears the autosave', () => {
    persistGantt(mergeConfig({}), { rows: [] })
    clearGantt()
    expect(restoreGantt()).toBeNull()
  })
})

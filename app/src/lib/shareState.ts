import LZString from 'lz-string'
import { parseGanttDoc, type GanttDoc } from './ganttDoc'

// Rough cap on the compressed payload; beyond this, prefer Save JSON over a link.
export const SHARE_CAP = 6000

export function encodeState(doc: unknown): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(doc))
}

export function decodeState(param: string): GanttDoc | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param)
    if (!json) return null
    const result = parseGanttDoc(json)
    return result.ok ? result.value : null
  } catch {
    return null
  }
}

export function isWithinShareCap(encoded: string): boolean {
  return encoded.length <= SHARE_CAP
}

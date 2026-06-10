import LZString from 'lz-string'
import type { BarConfig } from '../charts/bar/types'

export interface BarDoc {
  version: number
  kind: 'bar'
  config: Partial<BarConfig>
  csv: string
}

export interface BarParseResult {
  ok: boolean
  errors: string[]
  value: BarDoc | null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function parseBarDoc(input: string | unknown): BarParseResult {
  let raw: unknown = input
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch (err) {
      return { ok: false, errors: [(err as Error).message], value: null }
    }
  }
  if (!isObject(raw)) {
    return { ok: false, errors: ['document must be an object'], value: null }
  }
  if (!isObject(raw.config)) {
    return { ok: false, errors: ['missing config object'], value: null }
  }
  if (typeof raw.csv !== 'string') {
    return { ok: false, errors: ['missing csv string'], value: null }
  }
  const version = typeof raw.version === 'number' ? raw.version : 1
  return {
    ok: true,
    errors: [],
    value: { version, kind: 'bar', config: raw.config as Partial<BarConfig>, csv: raw.csv },
  }
}

export function serializeBarDoc(doc: BarDoc): string {
  return JSON.stringify(doc, null, 2)
}

function readText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export async function readBarFile(file: File): Promise<BarDoc> {
  const text = await readText(file)
  const result = parseBarDoc(text)
  if (!result.ok || !result.value) throw new Error(result.errors.join('; '))
  return result.value
}

export function encodeBarState(doc: BarDoc): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(doc))
}

export function decodeBarState(param: string): BarDoc | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param)
    if (!json) return null
    const result = parseBarDoc(json)
    return result.ok ? result.value : null
  } catch {
    return null
  }
}

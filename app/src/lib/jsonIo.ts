import { parseGanttDoc, type GanttDoc } from './ganttDoc'

// Pretty-printed save envelope for the full document.
export function serializeDoc(doc: unknown): string {
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

// Read + validate a Save/Load JSON file. Throws with a readable message.
export async function readDocFile(file: File): Promise<GanttDoc> {
  const text = await readText(file)
  const result = parseGanttDoc(text)
  if (!result.ok || !result.value) {
    throw new Error(result.errors.map((e) => `${e.path}: ${e.message}`).join('\n'))
  }
  return result.value
}

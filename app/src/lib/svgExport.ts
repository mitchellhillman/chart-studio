export function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function serializeSvg(el: SVGSVGElement): string {
  return el.outerHTML
}

export async function copySvg(el: SVGSVGElement): Promise<void> {
  await navigator.clipboard.writeText(serializeSvg(el))
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadSvg(el: SVGSVGElement, title: string): void {
  const blob = new Blob([serializeSvg(el)], { type: 'image/svg+xml' })
  downloadBlob(blob, (slugify(title) || 'chart') + '.svg')
}

export function downloadJson(json: string, title: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, (slugify(title) || 'chart') + '.json')
}

export interface FontOption {
  value: string
  label: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    value: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    label: 'IBM Plex Sans',
  },
  { value: '"Jost", "Futura", "Century Gothic", sans-serif', label: 'Jost (Futura)' },
  { value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Inter' },
  { value: '"Public Sans", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Public Sans' },
  { value: '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Roboto' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', label: 'Segoe UI' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  {
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    label: 'System default',
  },
]

export const DEFAULT_FONT = FONT_OPTIONS[0].value

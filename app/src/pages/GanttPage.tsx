import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader/AppHeader'
import ChartStage from '../components/ChartStage/ChartStage'
import ControlPanel from '../components/ControlPanel/ControlPanel'
import Group from '../components/Group/Group'
import Field from '../components/Field/Field'
import FieldRow from '../components/FieldRow/FieldRow'
import TextInput from '../components/TextInput/TextInput'
import TextArea from '../components/TextArea/TextArea'
import Select from '../components/Select/Select'
import NumberInput from '../components/NumberInput/NumberInput'
import Checkbox from '../components/Checkbox/Checkbox'
import RangeControl from '../components/RangeControl/RangeControl'
import ColorPicker from '../components/ColorPicker/ColorPicker'
import PaletteControl from '../components/PaletteControl/PaletteControl'
import FontControl from '../components/FontControl/FontControl'
import DataInput from '../components/DataInput/DataInput'
import Toolbar from '../components/Toolbar/Toolbar'
import GanttChart from '../charts/gantt/GanttChart'
import { useChartState } from '../hooks/useChartState'
import { detectAxisType } from '../lib/dates'
import { loadCustomPalettes, mapPaletteToCategories, saveCustomPalette } from '../lib/palettes'
import { readDocFile } from '../lib/jsonIo'
import { copySvg, downloadJson, downloadSvg } from '../lib/svgExport'
import { encodeState, isWithinShareCap } from '../lib/shareState'
import type { GanttModel } from '../lib/ganttDoc'
import styles from './GanttPage.module.css'

const PRESET_OPTIONS = [{ value: 'presidents', label: 'Presidents' }]

const AXIS_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
]

const LEGEND_POSITIONS = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]

function buildPaletteOptions() {
  return [{ value: '', label: 'Custom' }, ...Object.keys(loadCustomPalettes()).map((n) => ({ value: n, label: n }))]
}

function distinctCategories(model: GanttModel): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of model.rows) {
    for (const seg of row.segments) {
      if (seg.category && !seen.has(seg.category)) {
        seen.add(seg.category)
        out.push(seg.category)
      }
    }
  }
  return out
}

export default function GanttPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sharedParamRef = useRef(searchParams.get('s'))
  const {
    ready,
    config,
    dataText,
    model,
    dataError,
    updateConfig,
    setDataText,
    loadDoc,
    loadPreset,
    reset,
    doc,
  } = useChartState(sharedParamRef.current)

  const [preset, setPreset] = useState('presidents')
  const [paletteOptions, setPaletteOptions] = useState(buildPaletteOptions)
  const [status, setStatus] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)

  // Consume the share param after the hook has read it, so further edits
  // autosave normally and a refresh doesn't reload the stale link.
  useEffect(() => {
    if (sharedParamRef.current) setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(''), 2000)
  }

  const handleCopySvg = async () => {
    if (!svgRef.current) return
    try {
      await copySvg(svgRef.current)
      flash('copied svg')
    } catch {
      flash('copy failed')
    }
  }

  const handleDownloadSvg = () => {
    if (!svgRef.current) return
    downloadSvg(svgRef.current, config.title)
    flash('downloaded svg')
  }

  const handleSaveJson = () => {
    if (!doc) {
      flash('fix data errors first')
      return
    }
    downloadJson(JSON.stringify(doc, null, 2), config.title)
    flash('saved json')
  }

  const handleLoadJson = async (file: File) => {
    try {
      const next = await readDocFile(file)
      loadDoc(next)
      flash('loaded json')
    } catch {
      flash('load failed: invalid file')
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset chart and discard autosave?')) return
    void reset()
    flash('reset')
  }

  const handleShare = () => {
    if (!doc) {
      flash('fix data errors first')
      return
    }
    const encoded = encodeState(doc)
    if (!isWithinShareCap(encoded)) {
      flash('too large to link — use save json')
      return
    }
    setSearchParams({ s: encoded })
    const url = `${window.location.origin}${window.location.pathname}#/gantt?s=${encoded}`
    navigator.clipboard.writeText(url).then(
      () => flash('share link copied'),
      () => flash('copy failed'),
    )
  }

  const categories = useMemo(() => (model ? distinctCategories(model) : []), [model])
  const axisWarning = useMemo(
    () => (model && config.axis === 'auto' ? detectAxisType(model).warning : undefined),
    [model, config.axis],
  )

  const handleSavePalette = (name: string) => {
    const series = categories.map((c) => config.categoryColors[c]).filter(Boolean)
    if (saveCustomPalette(name, { series, background: config.background })) {
      setPaletteOptions(buildPaletteOptions())
      updateConfig({ palette: name })
    }
  }

  // Applying a palette recolors the categories from its series (and its
  // background); "Custom" ('') just clears the selection.
  const handlePaletteChange = (name: string) => {
    const pal = name ? loadCustomPalettes()[name] : undefined
    if (!pal || !pal.series.length) {
      updateConfig({ palette: name })
      return
    }
    const categoryColors = mapPaletteToCategories(pal.series, categories)
    updateConfig({ palette: name, categoryColors, background: pal.background })
  }

  if (!ready) {
    return (
      <>
        <AppHeader />
        <main style={{ padding: 20 }}>Loading…</main>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className={styles.layout}>
        <ControlPanel>
          <Group title="Data">
            <Field label="Load preset" htmlFor="preset">
              <Select
                id="preset"
                value={preset}
                options={PRESET_OPTIONS}
                onChange={(v) => {
                  setPreset(v)
                  void loadPreset(v)
                }}
              />
            </Field>
            <Field label="Data (JSON)" htmlFor="data">
              <DataInput id="data" value={dataText} onChange={setDataText} error={dataError} />
            </Field>
          </Group>

          <Group title="Text">
            <Field label="Title" htmlFor="title">
              <TextInput id="title" value={config.title} onChange={(v) => updateConfig({ title: v })} />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle">
              <TextInput
                id="subtitle"
                value={config.subtitle}
                onChange={(v) => updateConfig({ subtitle: v })}
              />
            </Field>
            <Field label="Eyebrow" htmlFor="eyebrow">
              <TextInput
                id="eyebrow"
                value={config.eyebrow}
                onChange={(v) => updateConfig({ eyebrow: v })}
              />
            </Field>
            <Field label="Source (one line per row)" htmlFor="source">
              <TextArea
                id="source"
                rows={3}
                value={config.source.join('\n')}
                onChange={(v) => updateConfig({ source: v.split('\n') })}
              />
            </Field>
          </Group>

          <Group title="Size">
            <Field label="Chart width (px)" htmlFor="width">
              <RangeControl
                id="width"
                value={config.width}
                min={300}
                max={2000}
                step={10}
                onChange={(v) => updateConfig({ width: v })}
              />
            </Field>
            <Field label="Row height (px)" htmlFor="rowHeight">
              <RangeControl
                id="rowHeight"
                value={config.rowHeight}
                min={8}
                max={80}
                step={1}
                onChange={(v) => updateConfig({ rowHeight: v })}
              />
            </Field>
            <Field label="Row gap (px)" htmlFor="rowGap">
              <NumberInput
                id="rowGap"
                value={config.rowGap}
                min={0}
                max={40}
                step={1}
                onChange={(v) => updateConfig({ rowGap: v })}
              />
            </Field>
          </Group>

          <Group title="Axis">
            <Field label="Axis type" htmlFor="axis">
              <Select
                id="axis"
                value={config.axis}
                options={AXIS_OPTIONS}
                onChange={(v) => updateConfig({ axis: v as typeof config.axis })}
              />
            </Field>
            <Field label="Tick interval" htmlFor="tick" help="blank = auto">
              <TextInput
                id="tick"
                mono
                value={config.tickInterval == null ? '' : String(config.tickInterval)}
                onChange={(v) => {
                  const t = v.trim()
                  updateConfig({ tickInterval: t === '' ? null : Number(t) })
                }}
              />
            </Field>
            <FieldRow align="end">
              <Field>
                <Checkbox
                  id="topAxis"
                  label="Top axis"
                  checked={config.showTopAxis}
                  onChange={(v) => updateConfig({ showTopAxis: v })}
                />
              </Field>
              <Field>
                <Checkbox
                  id="bottomAxis"
                  label="Bottom axis"
                  checked={config.showBottomAxis}
                  onChange={(v) => updateConfig({ showBottomAxis: v })}
                />
              </Field>
            </FieldRow>
          </Group>

          <Group title="Legend">
            <FieldRow align="end">
              <Field label="Position" htmlFor="legendPos">
                <Select
                  id="legendPos"
                  value={config.legendPosition}
                  options={LEGEND_POSITIONS}
                  onChange={(v) => updateConfig({ legendPosition: v as typeof config.legendPosition })}
                />
              </Field>
              <Field>
                <Checkbox
                  id="showLegend"
                  label="Show legend"
                  checked={config.showLegend}
                  onChange={(v) => updateConfig({ showLegend: v })}
                />
              </Field>
            </FieldRow>
          </Group>

          <Group title="Colors">
            <Field label="Palette" htmlFor="palette">
              <PaletteControl
                id="palette"
                options={paletteOptions}
                value={config.palette}
                onChange={handlePaletteChange}
                onSave={handleSavePalette}
              />
            </Field>
            <Field label="Background" htmlFor="bg">
              <ColorPicker
                id="bg"
                value={config.background}
                onChange={(v) => updateConfig({ background: v })}
              />
            </Field>
            <Field label="Legend background" htmlFor="legendBg">
              <ColorPicker
                id="legendBg"
                value={config.legendBackground}
                onChange={(v) => updateConfig({ legendBackground: v })}
              />
            </Field>
            {categories.map((cat) => (
              <Field key={cat} label={cat} htmlFor={`cat-${cat}`}>
                <ColorPicker
                  id={`cat-${cat}`}
                  value={config.categoryColors[cat] ?? ''}
                  onChange={(v) =>
                    updateConfig({
                      categoryColors: { ...config.categoryColors, [cat]: v },
                      palette: '',
                    })
                  }
                />
              </Field>
            ))}
          </Group>

          <Group title="Typography">
            <Field label="Font" htmlFor="font">
              <FontControl id="font" value={config.font} onChange={(v) => updateConfig({ font: v })} />
            </Field>
          </Group>
        </ControlPanel>

        <ChartStage
          footer={
            <Toolbar
              onCopySvg={handleCopySvg}
              onDownloadSvg={handleDownloadSvg}
              onSaveJson={handleSaveJson}
              onLoadJson={handleLoadJson}
              onReset={handleReset}
              onShare={handleShare}
              status={status}
            />
          }
        >
          {axisWarning && <p className={styles.warning}>{axisWarning}</p>}
          {dataError && <p className={styles.error}>{dataError}</p>}
          {model && <GanttChart model={model} config={config} svgRef={svgRef} />}
        </ChartStage>
      </div>
    </>
  )
}

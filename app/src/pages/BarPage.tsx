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
import Toolbar from '../components/Toolbar/Toolbar'
import BarChart from '../charts/bar/BarChart'
import { useBarState } from '../hooks/useBarState'
import { getSeries } from '../lib/parse'
import { loadCustomPalettes, mapPaletteToCategories, saveCustomPalette } from '../lib/palettes'
import { encodeBarState, readBarFile } from '../lib/barIo'
import { copySvg, downloadJson, downloadSvg } from '../lib/svgExport'
import { isWithinShareCap } from '../lib/shareState'
import styles from './GanttPage.module.css'

const CHART_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
]
const ORIENTATIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
]
const LEGEND_POSITIONS = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]
const DATA_MODES = [
  { value: 'paste', label: 'Paste' },
  { value: 'file', label: 'Upload file' },
]

function buildPaletteOptions() {
  return [
    { value: '', label: 'Custom' },
    ...Object.keys(loadCustomPalettes()).map((n) => ({ value: n, label: n })),
  ]
}

export default function BarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sharedParamRef = useRef(searchParams.get('s'))
  const { ready, config, csv, rows, updateConfig, setCsv, loadDoc, reset, doc } = useBarState(
    sharedParamRef.current,
  )

  const [dataMode, setDataMode] = useState('paste')
  const [fileName, setFileName] = useState('')
  const [paletteOptions, setPaletteOptions] = useState(buildPaletteOptions)
  const [status, setStatus] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (sharedParamRef.current) setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const series = useMemo(() => getSeries(rows), [rows])

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(''), 2000)
  }

  const handlePaletteChange = (name: string) => {
    const pal = name ? loadCustomPalettes()[name] : undefined
    if (!pal || !pal.series.length) {
      updateConfig({ palette: name })
      return
    }
    updateConfig({
      palette: name,
      colors: mapPaletteToCategories(pal.series, series),
      background: pal.background,
      legendBackground: pal.background,
    })
  }

  const handleSavePalette = (name: string) => {
    const seriesColors = series.map((s) => config.colors[s]).filter(Boolean)
    if (saveCustomPalette(name, { series: seriesColors, background: config.background })) {
      setPaletteOptions(buildPaletteOptions())
      updateConfig({ palette: name })
    }
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
    if (svgRef.current) {
      downloadSvg(svgRef.current, config.title)
      flash('downloaded svg')
    }
  }
  const handleSaveJson = () => {
    downloadJson(JSON.stringify(doc, null, 2), config.title)
    flash('saved json')
  }
  const handleLoadJson = async (file: File) => {
    try {
      loadDoc(await readBarFile(file))
      flash('loaded json')
    } catch {
      flash('load failed: invalid file')
    }
  }
  const handleReset = () => {
    if (!window.confirm('Reset chart and discard autosave?')) return
    reset()
    flash('reset')
  }
  const handleShare = () => {
    const encoded = encodeBarState(doc)
    if (!isWithinShareCap(encoded)) {
      flash('too large to link — use save json')
      return
    }
    setSearchParams({ s: encoded })
    const url = `${window.location.origin}${window.location.pathname}#/bar?s=${encoded}`
    navigator.clipboard.writeText(url).then(
      () => flash('share link copied'),
      () => flash('copy failed'),
    )
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
            <Field label="Data input" htmlFor="dataMode">
              <Select id="dataMode" value={dataMode} options={DATA_MODES} onChange={setDataMode} />
            </Field>
            {dataMode === 'paste' ? (
              <Field label="Data (CSV or TSV)" htmlFor="csv">
                <TextArea id="csv" rows={12} mono value={csv} onChange={setCsv} />
              </Field>
            ) : (
              <Field label="CSV file" htmlFor="csvfile">
                {fileName && <p className={styles.warning}>{fileName}</p>}
                <input
                  id="csvfile"
                  type="file"
                  accept=".csv,.tsv,text/csv,text/tab-separated-values"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    file.text().then((text) => {
                      setCsv(text)
                      setFileName(file.name)
                    })
                  }}
                />
              </Field>
            )}
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
            <Field label="Source (one line per row)" htmlFor="source">
              <TextArea
                id="source"
                rows={3}
                value={config.source.join('\n')}
                onChange={(v) => updateConfig({ source: v.split('\n') })}
              />
            </Field>
          </Group>

          <Group title="Chart">
            <FieldRow>
              <Field label="Chart type" htmlFor="type">
                <Select
                  id="type"
                  value={config.chartType}
                  options={CHART_TYPES}
                  onChange={(v) => updateConfig({ chartType: v as typeof config.chartType })}
                />
              </Field>
              <Field label="Orientation" htmlFor="orientation">
                <Select
                  id="orientation"
                  value={config.orientation}
                  options={ORIENTATIONS}
                  onChange={(v) => updateConfig({ orientation: v as typeof config.orientation })}
                />
              </Field>
            </FieldRow>
          </Group>

          <Group title="Size">
            <Field label="Chart width (px)" htmlFor="width">
              <RangeControl
                id="width"
                value={config.width}
                min={100}
                max={2000}
                step={10}
                onChange={(v) => updateConfig({ width: v })}
              />
            </Field>
            <Field label="Plot height (px)" htmlFor="plotHeight">
              <RangeControl
                id="plotHeight"
                value={config.plotHeight}
                min={50}
                max={2000}
                step={10}
                onChange={(v) => updateConfig({ plotHeight: v })}
              />
            </Field>
          </Group>

          <Group title="Bars & lines">
            <Field label="Bar gap (px)" htmlFor="barGap">
              <NumberInput
                id="barGap"
                value={config.barGap}
                min={0}
                max={100}
                step={1}
                onChange={(v) => updateConfig({ barGap: v })}
              />
            </Field>
            <Field>
              <Checkbox
                id="showDots"
                label="Show data point dots (line charts)"
                checked={config.showDots}
                onChange={(v) => updateConfig({ showDots: v })}
              />
            </Field>
            <Field label="Line thickness (px)" htmlFor="lineWidth">
              <NumberInput
                id="lineWidth"
                value={config.lineWidth}
                min={0.5}
                max={12}
                step={0.5}
                onChange={(v) => updateConfig({ lineWidth: v })}
              />
            </Field>
          </Group>

          <Group title="Axes">
            <Field label="Ticks" htmlFor="ticks">
              <NumberInput
                id="ticks"
                value={config.tickCount}
                min={2}
                max={20}
                step={1}
                onChange={(v) => updateConfig({ tickCount: v })}
              />
            </Field>
            <Field label="Axis labels shown" htmlFor="maxLabels" help="0 = all, min first + last">
              <NumberInput
                id="maxLabels"
                value={config.maxCategoryLabels}
                min={0}
                max={200}
                step={1}
                onChange={(v) => updateConfig({ maxCategoryLabels: v })}
              />
            </Field>
            <Field label="Tick date format" htmlFor="tickFmt" help="d3 time spec, e.g. %Y; blank = raw">
              <TextInput
                id="tickFmt"
                value={config.tickLabelFormat}
                onChange={(v) => updateConfig({ tickLabelFormat: v })}
              />
            </Field>
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
            {series.map((s) => (
              <Field key={s} label={s} htmlFor={`color-${s}`}>
                <ColorPicker
                  id={`color-${s}`}
                  value={config.colors[s] ?? ''}
                  onChange={(v) =>
                    updateConfig({ colors: { ...config.colors, [s]: v }, palette: '' })
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
          <BarChart rows={rows} config={config} svgRef={svgRef} />
        </ChartStage>
      </div>
    </>
  )
}

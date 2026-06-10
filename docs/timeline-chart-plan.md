# Gantt chart editor — new React SPA in the chart-studio repo

## Context

chart-studio is today a single static page (no build): `index.html` (inline CSS,
fixed header, control panel, toolbar) + `bar-chart.js` (~1084 lines vanilla D3 →
SVG), served on GitHub Pages at `mitchellhillman.github.io/chart-studio/`.

We're adding a **second editor**, a **Gantt chart**: horizontal rows, each a span
(start→end) across a shared axis, with optional nested/overlapping segments,
per-bar colors, and free-text labels in selectable positions — output as **SVG**,
reusing chart-studio's editorial design language (Jost/IBM Plex fonts, thin 1px
axis rules, gridlines, tick styling). It's inspired by the president-timeline
(lifespan span + term segment per row, dual year axes, "In office"/"Still living"
legend), but **generalized**: the axis is a range that need not be time.

This is the architectural step-up the user asked for: a **modern React SPA**
(React + Vite + React Router, TypeScript) living **in this same GitHub repo** and
deployed on **GitHub Pages** (no Vercel). The existing bar/line chart stays
**untouched at its current URL**; the React app lives at a subpath and is linked
from the header. The bar chart will be ported into React in a later phase, so
shared components and framework-agnostic `lib/` modules are structured for reuse
now.

### Locked decisions
- **React + Vite + TypeScript** SPA; D3 stays the SVG renderer.
- **CSS Modules** per component, on top of the ported `:root` design tokens.
- **Static SVG only — no interactivity** (no tooltips, hover, links, or modals;
  explicitly out of scope, consistent with the current bar/line chart).
- **Gantt first**; bar/line chart ported later. Build shared components now.
- **Same repo**, deploy on **GitHub Pages** (not Vercel) via **GitHub Actions**
  (one-time setting: Pages source = GitHub Actions). Legacy site stays live.
- Legacy bar chart **untouched at its URL**; React app at subpath `/chart-studio/app/`.
- **Data is JSON** — a single self-contained document `{version, kind:"gantt",
  config, data:{rows}}` that doubles as preset, Save/Load file, and share payload.
- Data model: **single range AND nested segments**, via the JSON shape.
- Field vocabulary: `rows[].{label, segments[].{start, end?, color?, category?,
  label?, labelPos?}}`.
- **Rows render in array order** (author-controlled).
- Axis: **date and numeric, auto-detected**.
- Labels: **free-text only** (no auto-computed value/age labels), positioned.
- URLs: **routes + shareable chart state** (client-side, compressed in the URL).
- Header nav links: **"Gantt"** and **"Bar/Line"** (on both the React app header
  and the legacy page header).
- **Full unit testing** — Vitest + React Testing Library for **both `lib/` and
  components**, run in CI as a deploy gate.
- **Tooling**: **npm**; **ESLint + Prettier** (lint runs in CI alongside tests).
- Two bundled default presets to load/test: **résumé** and **presidents**.
- **Storybook** scaffolded for local dev; shared UI components are built
  story-first, with stories derived from the original chart-studio controls.

## Data document (JSON)

One self-contained document is the unit of preset / Save / Load / Share:

```json
{
  "version": 1,
  "kind": "gantt",
  "config": {
    "title": "Presidents: lifespans & terms in office",
    "eyebrow": "UNITED STATES",
    "subtitle": "…",
    "source": ["Source: Wikipedia"],
    "axis": "auto",                  // auto | date | number
    "tickInterval": null,            // null = auto; else number/years
    "font": "\"IBM Plex Sans\", …",
    "palette": "",
    "categoryColors": { "In office": "#21409A", "Still living": "#A3C2E3", "Lifespan": "#E2E4E7" },
    "background": "#ffffff",
    "rowHeight": 22, "rowGap": 1, "width": 900,
    "showLegend": true, "legendPosition": "top-left",
    "showTopAxis": true, "showBottomAxis": true
  },
  "data": {
    "rows": [
      { "label": "George Washington", "segments": [
          { "start": "1732-02-22", "end": "1799-12-14", "category": "Lifespan" },
          { "start": "1789-04-30", "end": "1797-03-04", "category": "In office" } ] },
      { "label": "Joe Biden", "segments": [
          { "start": "1942-11-20", "category": "Still living" },
          { "start": "2021-01-20", "end": "2025-01-20", "category": "In office" } ] }
    ]
  }
}
```

Rules: `start` required; omit `end` → **open-ended** (extend to domain max).
`color` (hex, validated via `normalizeHex`) wins over `category`→palette, which
wins over the default sequence. `category` drives the legend. `label` is free
text; `labelPos ∈ start-inside|start-outside|end-inside|end-outside|center|above|below`.
The **DataInput** edits the `data` object as JSON with live validation; presets/
Save/Load/Share carry the whole document.

## Deployment (GitHub Pages via Actions, no Vercel)

Switch the Pages **source to "GitHub Actions"** and add `.github/workflows/deploy.yml`:
1. `cd app && npm ci && npm run lint && npm run test && npm run build`
   (Vite, `base:'/chart-studio/app/'`). **Lint + tests gate the deploy.**
2. Assemble `_site/` = **legacy files copied verbatim** (`index.html`, `bar-chart.js`,
   `data.csv`, `data/`, `deco/`, `palettes/`) at root **plus** `app/dist/` → `_site/app/`.
3. `actions/upload-pages-artifact` + `actions/deploy-pages`.

Result: legacy stays at `…/chart-studio/` (identical content + URL); React app at
`…/chart-studio/app/`. Fallback if Actions is undesirable: commit `app/dist` to
`/app` and keep deploy-from-branch — documented but not preferred.

**Routing:** **`HashRouter`** so deep links/refresh work on Pages with no 404 hacks:
`…/chart-studio/app/#/gantt`. Shareable state rides as a search param on the hash
route (`#/gantt?s=<compressed>`), read via `useSearchParams`.

**Cross-links / header nav:** both headers expose the same two links — **"Gantt"**
(→ `app/#/gantt`) and **"Bar/Line"** (→ legacy `…/chart-studio/`). The legacy
`index.html` `.app-bar` gets these two `<a>`s (the only, additive edit to legacy);
the React `AppHeader` renders the same pair, marking the active one.

## Repo layout

```
chart-studio/                  # repo root = GH Pages site root (legacy, unchanged)
  index.html  bar-chart.js  data.csv  data/  deco/  palettes/   # + additive nav links
  .github/workflows/deploy.yml # NEW — test + build app + assemble Pages artifact
  app/                         # NEW Vite + React SPA (TypeScript)
    index.html  package.json  vite.config.ts  tsconfig.json  vitest.setup.ts
    .eslintrc.cjs  .prettierrc
    .storybook/ main.ts preview.ts
    public/
      deco/                    # logo + favicons (copied)
      presets/                 # bundled self-contained docs (fetched at runtime)
        presidents.json  resume.json
    src/
      main.tsx  App.tsx                      # HashRouter; route /gantt (redirect /)
      styles/ tokens.css base.css fonts.css  # ported :root vars, global base, font links
      pages/ GanttPage.tsx  (BarPage.tsx later)
      components/                            # SHARED chart-agnostic UI (CSS Modules)
        AppHeader  ControlPanel  Group  Field  FieldRow
        TextInput  TextArea  Select  NumberInput  Checkbox
        RangeControl  ColorPicker  PaletteControl  FontControl
        DataInput  Toolbar  ChartStage
        # each: Foo.tsx  Foo.module.css  Foo.stories.tsx  Foo.test.tsx
      charts/gantt/
        GanttChart.tsx        # <svg ref> + useEffect → renderGantt
        renderGantt.ts        # PURE D3 renderer (svgEl, model, cfg) → SVG
        layout.ts             # axis detect, scales, band layout, label engine
        types.ts defaults.ts  *.test.ts
      lib/                    # FRAMEWORK-AGNOSTIC (+ colocated *.test.ts)
        ganttDoc.ts           # parse/validate the JSON document → typed model
        parse.ts              # legacy CSV parseData (for the later bar port)
        dates.ts measure.ts color.ts palettes.ts
        persistence.ts svgExport.ts jsonIo.ts shareState.ts
      hooks/ useChartState.ts useShareLink.ts
```

### Port these `bar-chart.js` functions into `lib/` (pure, no globals/DOM)
- `parseData` → `lib/parse.ts` (kept for the later bar/line port).
- **NEW** `lib/ganttDoc.ts`: validate + normalize the JSON doc (errors with line/field
  context for the DataInput), produce the typed `{rows:[{label,segments}]}` model.
- `parseLabelDate`, `formatLabel`, `thinLabels`, `labelRowsFor` → `lib/dates.ts`
  (`parseLabelDate` seeds `detectAxisType`).
- `measureMaxTextWidth` → `lib/measure.ts`; `normalizeHex` → `lib/color.ts`.
- `PALETTES`, `DEFAULT_PALETTE`, `readCustomPalettes`, `loadCustomPalettes`,
  `saveCustomPalette` → `lib/palettes.ts`. **Keep `barchart:palettes` key** so
  palettes are shared with the legacy app.
- `persistState`/`restoreState` → `lib/persistence.ts`, **new key `gantt:autosave`**.
- `slugify` + copy/download/save/load handlers → `lib/svgExport.ts` + `lib/jsonIo.ts`.

## D3 Gantt renderer (`charts/gantt/`)

**Ownership:** React owns controls + state; D3 owns the SVG subtree via a ref.
`useEffect([model, cfg])` calls `renderGantt(svgRef.current, model, cfg)` which
does `d3.select(el).selectAll('*').remove()` then full-rebuilds. The SVG is
**self-contained, static, and serializable** for Copy/Download (same export
contract as today: `xmlns`, `viewBox`, width/height, background `<rect>`, `<title>`,
inline presentation attributes; no event handlers).

**Model** (from `ganttDoc`): `rows[]` in array order; each row a `label` + ordered
`segments[]`. Segments of a row draw as **full-row-height** rects in array order
(later paints on top → nesting, the lifespan-then-term look). Omitted `end` =
open-ended → clamp to domain max. A segment with `end === start` renders as a
**point marker** (small diamond) instead of a bar — e.g. a graduation date.

**Axis auto-detect** (`detectAxisType`): all start/end parse as dates → `scaleUtc`;
else all numeric → `scaleLinear`; mixed → numeric + status warning.
Domain `[min(start), max(end)]`, open-ends clamped to max.

**Ticks:** dual top+bottom axes, vertical gridlines (`var(--tick)`), 1px rules.
Numeric `scale.ticks(clamp(width/90,4,12))`; dates use a nice-year-step picker
`[1,2,5,10,25,50,100]` (presidents → 25-yr). `tickInterval` override with "Auto".

**Layout:** x = date/numeric scale over `[0, plotWidth]`; `leftGutter` from
`measureMaxTextWidth(rowLabels)` + pad; y = `scaleBand(rowLabels)`.

**Label engine** (`placeLabel`) — **free text only**: optional `label` per segment
at `labelPos`; per-row label in the left gutter (anchor end, weight 500). Inside
labels get luminance-based contrast fill and auto-flip inside→outside when wider
than the bar. Nothing is auto-computed.

**Legend:** category legend (port `drawLegend`) mapping distinct `category` values →
`categoryColors`/palette. **Title block:** eyebrow (uppercase), title (18/700),
subtitle (14/700), source footnotes (12px, `#6b7280`).

## Storybook (local dev)

Scaffold Storybook 8 for React + Vite inside `app/` (`.storybook/main.ts` +
`preview.ts`, scripts `storybook` / `build-storybook`). `preview.ts` imports
`tokens.css` + `base.css` + `fonts.css` on a `--surface` background. Stories glob
`src/**/*.stories.tsx`. **Local-dev only** — not in the Pages artifact. Build the
shared components **story-first**, each story mapped to an original chart-studio
control so the library reproduces today's UI before it's wired into pages:

| Component | Stories (from original controls) |
|---|---|
| `Select` | Chart type, Orientation, Legend position, Data mode |
| `TextInput` | Title, Subtitle, Eyebrow |
| `TextArea` | Source (multi-line), Data (JSON) |
| `NumberInput` | Tick count, Row height, Width |
| `RangeControl` | Width, Row height (slider + number synced, like `wireDimension`) |
| `Checkbox` | Show legend, Show top axis, Show bottom axis |
| `ColorPicker` | Background, Legend background, A category color (swatch + hex, `normalizeHex`) |
| `PaletteControl` | Palette select (Economist / warm / Monochrome / Custom) + Save-palette |
| `FontControl` | Font select (IBM Plex Sans default, Jost, Inter, Public Sans, Roboto, Helvetica, Segoe UI, Arial, System) |
| `DataInput` | JSON editor (valid), invalid-JSON error state, file upload + filename |
| `Group`/`Field`/`FieldRow` | Layout primitives — a "Colors group" composite story |
| `Toolbar` | Default (Copy SVG / Download SVG / Save JSON / Load JSON / Reset / Share) + status flash |
| `AppHeader` | Nav (Gantt / Bar/Line), active-state variants |

## Testing (Vitest + React Testing Library — full coverage)

Configure Vitest in `vite.config.ts` (`test:` block) with `jsdom` env and
`vitest.setup.ts` (`@testing-library/jest-dom`). Scripts: `test`, `test:watch`,
`coverage`. Tests are colocated (`*.test.ts(x)`).

- **`lib/`:** `ganttDoc` (valid/invalid docs, missing `start`, open-ended, color/
  category precedence), `dates.detectAxisType` (date/numeric/mixed) + tick-step
  picker, `color.normalizeHex`, `palettes` (save/load round-trip), `shareState`
  (encode/decode round-trip + size-cap fallback), `jsonIo` (Save/Load envelope).
- **components (RTL):** every control fires its callback (`Select`, `TextInput`,
  `NumberInput`, `Checkbox`); `ColorPicker` rejects bad hex; `RangeControl` keeps
  slider+number in sync; `PaletteControl` save-palette flow; `DataInput` applies
  valid JSON and surfaces errors on invalid; `Toolbar` invokes each action + shows
  the status flash; `AppHeader` renders both nav links and the active state.
- **renderer:** mount `GanttChart` in jsdom and assert SVG structure (row/rect
  counts, dual axes, legend, open-ended clamp).
- **CI:** the deploy workflow runs `npm run test` before build — failures block deploy.

## Shareable state (`lib/shareState.ts`)
`encodeState(doc)` = `LZString.compressToEncodedURIComponent(JSON)`; decode
validates the document. Lives in the hash search param `s`. **Load precedence**
(`useChartState`): `?s=` link → `gantt:autosave` → bundled default preset
(presidents). Every change → debounced `persistState`. Share copies the full URL +
status flash; if compressed > ~6KB, skip the link and tell the user to Save JSON.

## Default presets (bundled `*.json` in `app/public/presets/`)

Self-contained documents (title/subtitle/source live in `config`, so no `.txt`
sidecars needed). A **"Load preset"** control fetches these; presidents is the
initial default.

**presidents.json** — converted from the president-timeline `data.json`
(`name`, `birth`, `death|null`, `terms[].{start,end}`, ISO dates). Each row: a
`Lifespan` segment (birth→death; omit `end` + category `Still living` when
`death:null`), then one `In office` segment per term (Grover Cleveland → two).
`categoryColors`: Lifespan `#E2E4E7`, In office `#21409A`, Still living `#A3C2E3`.
Date axis, 25-yr ticks. Source: Wikipedia. (Endpoint age numbers, if wanted, are
typed as free-text segment `label`s.)

**resume.json** — Mitchell's career timeline from `mitchellhillman.com/resume.html`
(re-read at implementation for exact months). Single-segment rows, category
`Work`/`Education`, omit `end` for "Present" (Telus Digital, Jan 2023→). The three
concurrent 2012–2014 roles (CFA Institute / Journey Group / Venveo) **merge into one
row**; education is a **point marker** at graduation (Liberty University, May 2011).
Date axis, month granularity. Other roles: Bottomline, Room Key, Silverchair.

## Phasing (each independently verifiable)
1. Scaffold `app/` (Vite React TS, **npm**) + deps `d3`, `react-router-dom`,
   `lz-string`, `@storybook/*`, `vitest`, `@testing-library/react`,
   `@testing-library/jest-dom`, `jsdom`, `eslint`, `prettier`. Add ESLint + Prettier
   config and `lint`/`format` scripts.
2. Port `:root` tokens + global base CSS + font links; build `AppHeader` (Gantt /
   Bar/Line nav), `HashRouter`, `/gantt` route (redirect `/`).
3. **Scaffold Storybook + Vitest/RTL**; build shared components **story-first**
   with **colocated tests** (table above). Verify `npm run storybook` + `npm run test`.
4. Port pure `lib/` modules **with unit tests**; `ganttDoc` validation + `detectAxisType`.
5. `layout.ts` + `renderGantt.ts` + `GanttChart.tsx` with presidents preset:
   bars, dual axes, gridlines, legend, title block + a renderer structure test;
   verify Copy/Download SVG is a clean standalone file matching the reference.
6. Label engine: free-text labels in all positions, per-row labels, contrast/auto-flip.
7. Controls wired to `useChartState` (Data JSON + Load preset, Text/eyebrow, Size,
   Axis, Labels, Colors/palette + Save palette, Legend, Typography); full redraw.
8. Toolbar: Copy SVG, Download SVG, Save/Load JSON, Reset, Share link + `shareState`.
9. `.github/workflows/deploy.yml` (test → build → assemble) + Pages-from-Actions;
   add legacy header links; update README (dev/test/storybook/build/deploy).
10. (Later) Port bar/line renderer into `charts/bar/` reusing `lib/` + components;
    add `/bar` route (the "Bar/Line" link can then point inside the SPA).

## Risks / flags
- **Pages source switch** to Actions is a one-time manual repo setting; the workflow
  must republish legacy files so the legacy URL is byte-identical.
- **Base path**: Vite `base:'/chart-studio/app/'` + HashRouter; update if repo renamed.
- **JSON validation UX**: malformed `data` must show a clear inline error, not a blank
  chart — `ganttDoc` returns structured errors the DataInput renders.
- **Large-data share URLs**: hard cap + graceful Save-JSON fallback.
- **Nested z-order**: documented "later segments draw on top"; per-category vertical
  inset deferred.
- **Open-ended ends**: omitted `end` → category color, extend to axis max.
- **Résumé data**: the fetch conflated some 2012–2014 roles; re-read the résumé when
  building `resume.json` (and confirm concurrent vs sequential roles).
- **Font-in-SVG**: same family-name-only limitation as the legacy export (acceptable).

## Verification
- `npm run lint` is clean and `npm run test` → all `lib/` + component + renderer
  tests pass (both run in CI as deploy gates).
- `npm run storybook` → each shared component story renders in the real design context.
- `npm run dev` → load presidents preset; matches the reference (dual 25-yr axes,
  grey lifespan + blue term, living rows light-blue, per-row name labels). Switch to
  résumé → work/education rows, "Present" open-ended.
- Toggle each control (axis type/interval, label positions, palette, font, size,
  legend) → live redraw + `gantt:autosave` persistence. Paste invalid JSON → inline error.
- Copy/Download SVG → clean self-contained static SVG (no event handlers).
- Save JSON → reload → Load JSON reproduces; Reset clears autosave.
- Share link → fresh tab → identical chart; oversized data falls back to Save JSON.
- `npm run build` + `npm run preview` under `/chart-studio/app/`; deep-link refresh
  works (HashRouter). Legacy `…/chart-studio/` still works; header links work.

# Range / Timeline chart editor — new React SPA in the chart-studio repo

## Context

chart-studio is today a single static page (no build): `index.html` (inline CSS,
fixed header, control panel, toolbar) + `bar-chart.js` (~1084 lines vanilla D3 →
SVG), served on GitHub Pages at `mitchellhillman.github.io/chart-studio/`.

We're adding a **second editor**: a generalized **range / timeline chart** that
renders horizontal rows, each a span (start→end) across a shared axis, with
optional nested/overlapping segments, per-bar colors, and labels in selectable
positions — output as **SVG**, reusing chart-studio's editorial design language
(Jost/IBM Plex fonts, thin 1px axis rules, gridlines, tick styling). It's
inspired by the president-timeline (lifespan span + term segment per row, dual
year axes, "In office"/"Still living" legend).

This is the architectural step-up the user asked for: a **modern React SPA**
(React + Vite + React Router) living **in this same GitHub repo** and deployed on
**GitHub Pages** (no Vercel). The existing bar/line chart stays **untouched at its
current URL**; the React app lives at a subpath and is linked from the header.
The bar chart will be ported into React in a later phase, so shared components
and framework-agnostic `lib/` modules are structured for reuse now.

### Locked decisions
- **React + Vite** SPA; D3 stays the SVG renderer.
- **Timeline first**; bar/line chart ported later. Build shared components now.
- **Same repo**, deploy on **GitHub Pages** (not Vercel). Legacy site stays live.
- Legacy bar chart **untouched at its URL**; React app at subpath `/chart-studio/app/`.
- Data model: **single range AND nested segments**, via the CSV shape.
- CSV convention: **Group key + one row per segment**.
- Axis: **date and numeric, auto-detected**.
- URLs: **routes + shareable chart state** (client-side, compressed in the URL).
- Two bundled default presets to load/test: **résumé** and **presidents**.

## Deployment (GitHub Pages, no Vercel)

GitHub Pages can't run a build on its own, so switch the Pages **source to
"GitHub Actions"** and add `.github/workflows/deploy.yml` that:
1. `cd app && npm ci && npm run build` (Vite, `base: '/chart-studio/app/'`).
2. Assembles a `_site/` artifact = **legacy files copied verbatim** (`index.html`,
   `bar-chart.js`, `data.csv`, `data/`, `deco/`, `palettes/`) at root **plus**
   `app/dist/` → `_site/app/`.
3. `actions/upload-pages-artifact` + `actions/deploy-pages`.

Result: legacy stays at `…/chart-studio/` (identical content + URL); React app at
`…/chart-studio/app/`. One-time manual step: set Pages source = GitHub Actions
(note for the user). Fallback if Actions is undesirable: commit `app/dist` to
`/app` and keep deploy-from-branch — documented but not preferred.

**Routing:** use **`HashRouter`** so deep links/refresh work on Pages with no
404 hacks: `…/chart-studio/app/#/timeline`. Shareable state rides as a search
param on the hash route (`#/timeline?s=<compressed>`), read via `useSearchParams`.

**Cross-links (only additive edit to legacy):** add one `<a>` in the legacy
`index.html` `.app-bar` header → `app/#/timeline`; the React header links back to
`../` (legacy). Both under `/chart-studio/`, so relative links work.

## Repo layout

```
chart-studio/                  # repo root = GH Pages site root (legacy, unchanged)
  index.html  bar-chart.js  data.csv  data/  deco/  palettes/   # + 1 additive nav link
  .github/workflows/deploy.yml # NEW — build app + assemble Pages artifact
  app/                         # NEW Vite + React SPA
    index.html  package.json  vite.config.ts  tsconfig.json
    public/
      deco/                    # logo + favicons (copied)
      presets/                 # bundled loadable presets (fetched at runtime)
        presidents.csv  presidents.txt  presidents.json
        resume.csv      resume.txt      resume.json
    src/
      main.tsx  App.tsx                      # HashRouter; routes /timeline (redirect /)
      styles/ tokens.css base.css fonts.css  # ported :root vars, panel CSS, font links
      pages/ TimelinePage.tsx  (BarPage.tsx later)
      components/                            # SHARED chart-agnostic UI
        AppHeader.tsx ControlPanel.tsx Group.tsx Field.tsx FieldRow.tsx
        TextInput.tsx TextArea.tsx Select.tsx NumberInput.tsx Checkbox.tsx
        RangeControl.tsx ColorPicker.tsx PaletteControl.tsx FontControl.tsx
        DataInput.tsx Toolbar.tsx ChartStage.tsx
      charts/timeline/
        TimelineChart.tsx     # <svg ref> + useEffect → renderTimeline
        renderTimeline.ts     # PURE D3 renderer (svgEl, model, cfg) → SVG
        layout.ts             # axis detect, scales, band layout, label engine
        types.ts defaults.ts
      lib/                    # FRAMEWORK-AGNOSTIC (ported from bar-chart.js)
        parse.ts dates.ts measure.ts color.ts palettes.ts
        persistence.ts svgExport.ts jsonIo.ts shareState.ts
      hooks/ useChartState.ts useShareLink.ts
```

### Port these `bar-chart.js` functions into `lib/` (pure, no globals/DOM)
- `parseData` → `lib/parse.ts` (add `parseRangeCsv` for the Group-key shape; keep
  delimiter sniff + `d3.dsvFormat`).
- `parseLabelDate`, `formatLabel`, `thinLabels`, `labelRowsFor` → `lib/dates.ts`
  (`parseLabelDate` seeds `detectAxisType`).
- `measureMaxTextWidth` → `lib/measure.ts`; `normalizeHex` → `lib/color.ts`.
- `PALETTES`, `DEFAULT_PALETTE`, `readCustomPalettes`, `loadCustomPalettes`,
  `saveCustomPalette` → `lib/palettes.ts` (take colors as args). **Keep
  `barchart:palettes` key** so palettes are shared with the legacy app.
- `persistState`/`restoreState` → `lib/persistence.ts`, **new key `timeline:autosave`**
  (don't clobber the legacy chart's autosave).
- `slugify` + copy/download/save/load handlers → `lib/svgExport.ts` + `lib/jsonIo.ts`.

## D3 range renderer (`charts/timeline/`)

**Ownership:** React owns controls + state; D3 owns the SVG subtree via a ref.
`useEffect([model, cfg])` calls `renderTimeline(svgRef.current, model, cfg)` which
does `d3.select(el).selectAll('*').remove()` then full-rebuilds (mirrors the
legacy `container.innerHTML=""` redraw — simple, fast at this scale, keeps the SVG
**self-contained and serializable** for Copy/Download, same export contract as
today: `xmlns`, `viewBox`, width/height, background `<rect>`, `<title>`, inline
presentation attributes).

**Parsed model** (`parseRangeCsv`): a `Group` column names the row; each line is a
`Segment {start, end|null, color|null, category|null, label|null, labelPos}`.
Rows sharing a Group stack as **full-row-height** rects in **CSV order** (later
paints on top → nesting, exactly the lifespan-then-term look). One line/group =
single range. Blank `end` = **open-ended** (extend to domain max; e.g. "still
living"/"Present").

**Axis auto-detect** (`detectAxisType`): if all start/end values parse as dates →
`scaleUtc`; else if all numeric → `scaleLinear`; mixed → numeric + status warning.
Domain `[min(start), max(end)]`, open-ends clamped to max.

**Ticks:** dual top+bottom axes, vertical gridlines (`var(--tick)`), 1px rules.
Numeric uses `scale.ticks(clamp(width/90,4,12))`; dates use a nice-year-step
picker `[1,2,5,10,25,50,100]` (so presidents get 25-yr ticks like the reference).
Expose an interval/count override with an "Auto" default.

**Layout:** x = date/numeric scale over `[0, plotWidth]`; `leftGutter` from
`measureMaxTextWidth(groupKeys)` + pad; y = `scaleBand(groupKeys)`, full-height
segment rects.

**Label engine** (`placeLabel`): `LabelPosition =
start-inside|start-outside|end-inside|end-outside|center|above|below`. Per-row
label sits left in the gutter (anchor end, weight 500). Optional start/end
**value labels** (`tabular-nums`) default to outside the ends (the president ages).
Inside-bar labels get luminance-based contrast fill; auto-flip inside→outside when
label width > bar width.

**Legend:** category legend (port `drawLegend` swatch layout) mapping distinct
`category` values → palette colors (e.g. In office / Still living / Lifespan).

**Title block:** eyebrow (small uppercase, e.g. "UNITED STATES"), title (18/700),
subtitle (14/700), source footnotes (12px, `#6b7280`).

## Shareable state (`lib/shareState.ts`)
`encodeState({config,csv})` = `LZString.compressToEncodedURIComponent(JSON)`;
decode validates `{v,config,csv}`. Lives in the hash search param `s`.
**Load precedence** (`useChartState`): `?s=` link → `timeline:autosave` → bundled
default preset (presidents). Every change → debounced `persistState`. Share button
copies the full URL + status flash; if compressed size > ~6KB, skip the link and
tell the user to Save JSON. Save/Load JSON keeps the `{version,config,csv}` envelope
(add `kind:'timeline'`).

## Default presets (bundled in `app/public/presets/`)

Both follow CLAUDE.md `.txt` sibling convention (title / subtitle / blank / sources).

**presidents** — converted from the president-timeline `data.json`
(`name`, `birth`, `death|null`, `terms[].{start,end}`, ISO dates). Generate
`presidents.csv` in the Group-key shape: a `Lifespan` segment (birth→death; blank
end + category `Still living` when `death:null`), then one `In office` segment per
term (Grover Cleveland → two). Categories drive colors (Lifespan grey, In office
`#21409A`, Still living `#A3C2E3`). Date axis, 25-yr ticks. Source: Wikipedia.

**resume** — Mitchell's career timeline from `mitchellhillman.com/resume.html`
(re-read at implementation time for exact months). Single-range rows, category
`Work`/`Education`, blank end for "Present" (Telus Digital, Jan 2023→). Date axis
at month granularity. Roles include Telus Digital, Bottomline, Room Key,
Silverchair, CFA Institute/Journey/Venveo, Liberty University.

A **"Load preset"** control in the toolbar/Data group fetches these; presidents is
the initial default.

## Phasing (each independently verifiable)
1. Scaffold `app/` (Vite React TS) + deps `d3`, `react-router-dom`, `lz-string`.
2. Port `:root` tokens + panel CSS + font links; build `AppHeader`, `HashRouter`,
   `/timeline` route (redirect `/`).
3. Port pure `lib/` modules; sanity-check `parseRangeCsv` + `detectAxisType` on a
   presidents CSV and a numeric CSV.
4. `layout.ts` + `renderTimeline.ts` + `TimelineChart.tsx` with the presidents
   preset hardcoded: bars, dual axes, gridlines, legend, title block; verify Copy/
   Download SVG is a clean standalone file matching the reference look.
5. Label engine: all positions, row labels, value labels, contrast/auto-flip.
6. Controls wired to `useChartState` (Data + Load preset, Text/eyebrow, Size, Axis,
   Labels, Colors/palette + Save palette, Legend, Typography); full redraw on change.
7. Toolbar: Copy SVG, Download SVG, Save/Load JSON, Reset, Share link + `shareState`.
8. `.github/workflows/deploy.yml` + Pages-from-Actions; add the additive legacy
   header link; update README with dev/build/deploy.
9. (Later) Port bar/line renderer into `charts/bar/` reusing `lib/` + components.

## Risks / flags
- **Pages source switch** to Actions is a one-time manual repo setting; the workflow
  must republish legacy files so the legacy URL is byte-identical.
- **Base path**: Vite `base:'/chart-studio/app/'` + HashRouter; if the repo/site
  name changes, update `base`.
- **Large-data share URLs**: hard cap + graceful Save-JSON fallback.
- **Nested z-order**: documented "later CSV lines draw on top"; optional per-category
  vertical inset deferred.
- **Open-ended ends** ("Present"/living): explicit rule — blank `end` → category
  color, extend to axis max.
- **Résumé data**: the fetch conflated some 2012–2014 roles; re-read the résumé when
  building `resume.csv`.
- **Font-in-SVG**: same family-name-only limitation as the legacy export (acceptable).

## Verification
- `cd app && npm run dev` → load presidents preset; chart matches the reference
  (dual 25-yr axes, grey lifespan + blue term, living rows light-blue, name + age
  labels). Switch to résumé preset → work/education rows, "Present" open-ended.
- Toggle each control (axis type/interval, label positions, palette, font, size,
  legend) and confirm live redraw + `timeline:autosave` persistence.
- Copy/Download SVG → open the file standalone; confirm clean self-contained SVG.
- Save JSON → reload → Load JSON reproduces; Reset clears autosave.
- Share link → open in a fresh tab → identical chart; oversized data falls back.
- `npm run build` + `npm run preview` under the `/chart-studio/app/` base; deep-link
  refresh works (HashRouter). Confirm legacy `…/chart-studio/` still works and its
  header links to the app.

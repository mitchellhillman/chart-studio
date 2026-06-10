# chart-studio

A browser-based bar/line chart iteration tool built with [D3](https://d3js.org/). Paste in CSV/TSV data, tweak the configuration, and export a clean SVG. Work autosaves to `localStorage`, and full chart state (data + config) can be saved to and loaded from JSON.

**Live version:** https://mitchellhillman.github.io/chart-studio/

This repo holds two things:

- The original **single-page bar/line tool** (`index.html` + `bar-chart.js`) at the site root.
- A **React SPA** under `app/` with a Gantt editor and a React port of the bar/line chart, deployed at `…/chart-studio/app/`.

## Running locally

The page loads `bar-chart.js` as an ES module, which browsers refuse to load over `file://`. Serve the directory over HTTP instead.

Python's built-in server is enough:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open:

```
http://127.0.0.1:8000/
```

Stop the server with `Ctrl+C`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | UI markup and inline CSS |
| `bar-chart.js` | Chart engine: rendering, parsing, config, SVG export, save/load |
| `data.csv` | Default dataset loaded on first visit |
| `data/` | Additional sample datasets |

## Per-row colors

Add a reserved `color` column to give each row (bar/category) its own
color, overriding the per-series palette. Values are hex, with or
without the leading `#`. Rows that leave it blank fall back to the
series color.

```csv
label,KIA,color
Operation Overlord — D-Day (Jun 1944),4414,#4b69aa
Okinawa (Apr 1945),12520,#ed4e51
```

## React app (`app/`)

A Vite + React + TypeScript SPA with a Gantt editor (`#/gantt`) and a React
port of the bar/line chart (`#/bar`). Routing is hash-based so deep links and
refreshes work on GitHub Pages. Chart state is shareable via a compressed `?s=`
URL param and autosaves to `localStorage`.

```bash
cd app
npm install
npm run dev        # local dev server
npm run test       # Vitest + React Testing Library
npm run lint       # ESLint
npm run storybook  # component library (local dev only)
npm run build      # production build to app/dist
```

## Deployment

GitHub Pages deploys via the `.github/workflows/deploy.yml` Actions workflow on
every push to `main`. It runs `lint` + `test` (a failure blocks the deploy),
builds the app, then assembles the published site:

- the legacy tool at the root (`index.html`, `bar-chart.js`, `data.csv`, `data/`, `deco/`, `palettes/`)
- the React app under `/app`

**One-time setup:** in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions** (instead of deploy-from-branch). The Vite `base` is
`/chart-studio/app/`; update it if the repo is renamed.

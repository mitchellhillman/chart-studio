# chart-studio

A browser-based bar/line chart iteration tool built with [D3](https://d3js.org/). Paste in CSV/TSV data, tweak the configuration, and export a clean SVG. Work autosaves to `localStorage`, and full chart state (data + config) can be saved to and loaded from JSON.

**Live version:** https://mitchellhillman.github.io/chart-studio/

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

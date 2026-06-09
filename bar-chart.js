const config = {
  title: "The cost of happiness",
  subtitle: "Men’s football World Cup, cheapest tickets*, $, 2026 prices",
  source: [
    "*Does not include discounted tickets offered to residents of host countries, or those resold",
    "†No data available   ‡Less than 3% of tickets sold at this price",
    "Sources: WorldCupGuide.com; FIFA",
  ],
  colors: {},
  backgroundColor: "#ffffff",
  legendBackground: "#f5f5f5",
  chartType: "bar",
  orientation: "vertical",
  dataInputMode: "paste",
  dataFileName: "",
  width: 500,
  plotHeight: 250,
  marginTop: 64,
  marginRight: 0,
  marginLeft: 0,
  labelGutterPad: 8,
  barGap: 8,
  tickCount: 5,
  tickLabelFormat: "",
  showDots: true,
  lineWidth: 3,
  maxCategoryLabels: 0,
  showLegend: true,
  legendPosition: "top-left",
  fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const DEFAULT_PALETTE = ["#363537", "#0cce6b", "#dced31"];
const AUTOSAVE_KEY = "barchart:autosave";
// Reserved column name for per-row bar/dot colors. Holds a hex value
// (with or without the leading "#"); excluded from the numeric series.
const COLOR_KEY = "color";

let dataText;
const restored = restoreState();
if (restored) {
  Object.assign(config, restored.config);
  dataText = restored.csv;
} else {
  try {
    const preset = await fetch("./data/fifa-revenue-by-source.json").then(r => r.json());
    Object.assign(config, preset.config);
    dataText = await fetch(preset.dataFile).then(r => r.text());
  } catch (_) {
    dataText = await fetch("./data.csv").then(r => r.text());
    config.dataFileName = "data.csv";
  }
}
let data = parseData(dataText);
render(data, config);
wireToolbar();
wireInputs();

function measureMaxTextWidth(labels, cfg, weight = 400) {
  if (!labels.length) return 0;
  const canvas = measureMaxTextWidth.canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${weight} 14px ${cfg.fontFamily}`;
  return Math.max(...labels.map(s => ctx.measureText(s).width));
}

function normalizeHex(s) {
  const v = (s ?? "").trim();
  if (!v) return null;
  const withHash = v.startsWith("#") ? v : "#" + v;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash) ? withHash : null;
}

function parseData(text) {
  const firstLine = text.split("\n").find(l => l.trim().length > 0) ?? "";
  const delim = firstLine.includes("\t") ? "\t" : ",";
  return d3.dsvFormat(delim).parse(text, d => {
    const row = { label: d.label };
    for (const key of Object.keys(d)) {
      if (key === "label") continue;
      if (key.toLowerCase() === COLOR_KEY) {
        row.color = normalizeHex(d[key]);
        continue;
      }
      const v = d[key];
      row[key] = v === "" || v == null ? null : +v;
    }
    return row;
  });
}

function getSeries(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter(k => k !== "label" && k !== "color");
}

function thinLabels(rows, cfg) {
  const n = rows.length;
  if (n <= 2) return rows;
  const max = cfg.maxCategoryLabels ?? 0;
  // 0 (or a value >= the count) shows every label; otherwise show `target`
  // labels evenly spaced, always including the first and last.
  if (!max || max <= 0 || max >= n) return rows;
  const target = Math.max(2, max);
  const idx = new Set();
  for (let i = 0; i < target; i++) {
    idx.add(Math.round((i * (n - 1)) / (target - 1)));
  }
  return [...idx].sort((a, b) => a - b).map(i => rows[i]);
}

function parseLabelDate(label) {
  const s = String(label).trim();
  if (!s) return null;
  const iso = /^\d{4}$/.test(s) ? s + "-01-01"
    : /^\d{4}-\d{2}$/.test(s) ? s + "-01"
    : s;
  const t = Date.parse(iso);
  return isNaN(t) ? null : new Date(t);
}

function formatLabel(label, cfg) {
  const fmt = cfg.tickLabelFormat?.trim();
  if (!fmt) return String(label);
  const d = parseLabelDate(label);
  if (!d) return String(label);
  try {
    return d3.utcFormat(fmt)(d);
  } catch (_) {
    return String(label);
  }
}

// Rows that get an axis tick + label. With a date format set, collapse rows
// that format to the same value to their first (earliest) occurrence — so for
// monthly data formatted as years, the tick sits on January, the year's start.
function labelRowsFor(rows, cfg) {
  if (cfg.tickLabelFormat?.trim()) {
    const seen = new Set();
    const out = [];
    for (const r of rows) {
      const f = formatLabel(r.label, cfg);
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(r);
    }
    return thinLabels(out, cfg);
  }
  return thinLabels(rows, cfg);
}

function ensureColors(series, cfg) {
  if (!cfg.colors) cfg.colors = {};
  series.forEach((s, i) => {
    if (!cfg.colors[s]) cfg.colors[s] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
  });
}

function render(rows, cfg) {
  const sourceLines = (Array.isArray(cfg.source) ? cfg.source : [cfg.source])
    .filter(line => line.length > 0);

  const sourceFirstOffset = 47;
  const sourceLineHeight = 14;
  const sourceDescender = 3;
  const bottomPadding = 8;
  const categoryLabelsBottom = 28;
  const sourceBottom = sourceLines.length > 0
    ? sourceFirstOffset + (sourceLines.length - 1) * sourceLineHeight + sourceDescender
    : 0;
  const marginBottom = Math.max(categoryLabelsBottom, sourceBottom) + bottomPadding;

  const series = getSeries(rows);
  ensureColors(series, cfg);

  const pad = 24;
  const contentHeight = cfg.marginTop + cfg.plotHeight + marginBottom;
  const totalWidth = cfg.width + pad * 2;
  const totalHeight = contentHeight + pad * 2;

  const container = document.getElementById("chart");
  container.innerHTML = "";

  const svg = d3.create("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("font-family", cfg.fontFamily)
    .attr("font-size", 14)
    .attr("fill", "#111827");

  svg.append("title").text(cfg.title);

  svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("fill", cfg.backgroundColor || "#ffffff");

  const root = svg.append("g").attr("transform", `translate(${pad}, ${pad})`);

  root.append("text")
    .attr("x", 0)
    .attr("y", 18)
    .attr("font-size", 18)
    .attr("font-weight", 700)
    .attr("fill", "#000")
    .text(cfg.title);

  root.append("text")
    .attr("x", 0)
    .attr("y", 38)
    .attr("font-size", 14)
    .attr("font-weight", 700)
    .attr("fill", "#000")
    .text(cfg.subtitle);

  const availableWidth = cfg.width - cfg.marginLeft - cfg.marginRight;
  const innerHeight = cfg.plotHeight;

  if (cfg.orientation === "horizontal") {
    drawHorizontal(root, rows, cfg, availableWidth, innerHeight);
  } else {
    drawVertical(root, rows, cfg, availableWidth, innerHeight);
  }

  if (cfg.showLegend !== false && series.length) {
    drawLegend(root, series, cfg, availableWidth, innerHeight);
  }

  root.append("g")
    .selectAll("text.source")
    .data(sourceLines)
    .join("text")
      .attr("class", "source")
      .attr("x", cfg.marginLeft)
      .attr("y", (_, i) => cfg.marginTop + innerHeight + sourceFirstOffset + i * sourceLineHeight)
      .attr("font-size", 12)
      .attr("fill", "#6b7280")
      .text(d => d);

  container.appendChild(svg.node());
}

function drawLegend(svg, series, cfg, availableWidth, innerHeight) {
  const pad = 0;       // flush to the plot corner
  const innerPad = 6;  // padding inside the legend box
  const swatch = 11;
  const gap = 6;
  const rowH = 18;

  const maxTextWidth = measureMaxTextWidth(series, cfg);
  const boxW = innerPad * 2 + swatch + gap + maxTextWidth;
  const boxH = innerPad * 2 + (series.length - 1) * rowH + swatch;

  const plotLeft = cfg.marginLeft;
  const plotRight = cfg.marginLeft + availableWidth;
  const plotTop = cfg.marginTop;
  const plotBottom = cfg.marginTop + innerHeight;

  const pos = cfg.legendPosition || "top-left";
  const gx = pos.includes("right") ? plotRight - pad - boxW : plotLeft + pad;
  const gy = pos.includes("bottom") ? plotBottom - pad - boxH : plotTop + pad;

  const g = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${gx}, ${gy})`);

  if (cfg.legendBackground) {
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", boxW)
      .attr("height", boxH)
      .attr("fill", cfg.legendBackground);
  }

  series.forEach((s, i) => {
    const ly = innerPad + i * rowH;
    g.append("rect")
      .attr("x", innerPad)
      .attr("y", ly)
      .attr("width", swatch)
      .attr("height", swatch)
      .attr("fill", cfg.colors[s]);
    g.append("text")
      .attr("x", innerPad + swatch + gap)
      .attr("y", ly + swatch - 1.5)
      .attr("font-size", 12)
      .attr("fill", "#111827")
      .text(s);
  });
}

function drawVertical(svg, rows, cfg, availableWidth, innerHeight) {
  const series = getSeries(rows);
  ensureColors(series, cfg);
  const labelRows = labelRowsFor(rows, cfg);
  const fmtActive = !!cfg.tickLabelFormat?.trim();

  const stackedData = cfg.chartType === "bar"
    ? d3.stack().keys(series)(rows.map(r => ({ ...r, ...Object.fromEntries(series.map(s => [s, r[s] ?? 0])) })))
    : null;

  const yMax = cfg.chartType === "bar"
    ? (d3.max(stackedData, ss => d3.max(ss, d => d[1])) || 0)
    : (d3.max(rows, r => d3.max(series, s => r[s])) || 0);

  const y = d3.scaleLinear()
    .domain([0, yMax]).nice()
    .range([innerHeight, 0]);

  const ticks = y.ticks(cfg.tickCount ?? 5);
  const labelGutter = measureMaxTextWidth(ticks.map(d => d3.format(",")(d)), cfg) + cfg.labelGutterPad;
  const barsEnd = availableWidth - labelGutter;

  const paddingInner = (cfg.barGap * rows.length) / barsEnd;
  const x = d3.scaleBand()
    .domain(rows.map(d => d.label))
    .range([0, barsEnd])
    .paddingInner(paddingInner)
    .paddingOuter(paddingInner / 2);

  // Drop a partial leading/trailing period label (e.g. data starting in
  // mid-1939) that would overlap its neighbor; full interior periods are
  // evenly spaced and never collide.
  let tickRows = labelRows;
  if (fmtActive && labelRows.length >= 2) {
    const cx = r => x(r.label) + x.bandwidth() / 2;
    const labelW = measureMaxTextWidth(labelRows.map(r => formatLabel(r.label, cfg)), cfg);
    tickRows = labelRows.slice();
    if (cx(tickRows[1]) - cx(tickRows[0]) < labelW * 1.5) tickRows = tickRows.slice(1);
    const n = tickRows.length;
    if (n >= 2 && cx(tickRows[n - 1]) - cx(tickRows[n - 2]) < labelW * 1.5) {
      tickRows = tickRows.slice(0, n - 1);
    }
  }

  const plot = svg.append("g")
    .attr("transform", `translate(${cfg.marginLeft}, ${cfg.marginTop})`);

  plot.append("g")
    .selectAll("line")
    .data(ticks)
    .join("line")
      .attr("x1", 0)
      .attr("x2", availableWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

  if (cfg.chartType === "line") {
    for (const s of series) {
      const lineGen = d3.line()
        .curve(d3.curveMonotoneX)
        .defined(d => d[s] != null && !isNaN(d[s]))
        .x(d => x(d.label) + x.bandwidth() / 2)
        .y(d => y(d[s]));
      plot.append("path")
        .datum(rows)
        .attr("d", lineGen)
        .attr("fill", "none")
        .attr("stroke", cfg.colors[s])
        .attr("stroke-width", cfg.lineWidth)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round");
      if (cfg.showDots) {
        const present = rows.filter(r => r[s] != null && !isNaN(r[s]));
        plot.append("g")
          .selectAll("circle")
          .data(present)
          .join("circle")
            .attr("cx", d => x(d.label) + x.bandwidth() / 2)
            .attr("cy", d => y(d[s]))
            .attr("r", 4)
            .attr("fill", d => d.color || cfg.colors[s]);
      }
    }
  } else {
    for (const seriesData of stackedData) {
      plot.append("g")
        .selectAll("rect")
        .data(seriesData)
        .join("rect")
          .attr("x", d => x(d.data.label))
          .attr("y", d => y(d[1]))
          .attr("width", x.bandwidth())
          .attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
          .attr("fill", d => d.data.color || cfg.colors[seriesData.key]);
    }
  }

  plot.append("g")
    .selectAll("text.tick")
    .data(ticks)
    .join("text")
      .attr("class", "tick")
      .attr("x", availableWidth)
      .attr("y", d => y(d) - 4)
      .attr("text-anchor", "end")
      .attr("font-variant-numeric", "tabular-nums")
      .attr("fill", "#111827")
      .text(d => d3.format(",")(d));

  plot.append("g")
    .selectAll("line.xtick")
    .data(tickRows)
    .join("line")
      .attr("class", "xtick")
      .attr("x1", d => x(d.label) + x.bandwidth() / 2)
      .attr("x2", d => x(d.label) + x.bandwidth() / 2)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight + 4)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

  plot.append("g")
    .selectAll("text.label")
    .data(tickRows)
    .join("text")
      .attr("class", "label")
      .attr("x", (d, i) =>
        fmtActive ? x(d.label) + x.bandwidth() / 2
        : i === 0 ? 0
        : i === tickRows.length - 1 ? barsEnd
        : x(d.label) + x.bandwidth() / 2)
      .attr("y", innerHeight + 18)
      .attr("text-anchor", (d, i) =>
        i === 0 ? "start"
        : i === tickRows.length - 1 ? "end"
        : "middle")
      .attr("font-weight", 500)
      .attr("fill", "#111827")
      .text(d => formatLabel(d.label, cfg));

  plot.append("line")
    .attr("x1", 0)
    .attr("x2", availableWidth)
    .attr("y1", innerHeight)
    .attr("y2", innerHeight)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
}

function drawHorizontal(svg, rows, cfg, availableWidth, innerHeight) {
  const series = getSeries(rows);
  ensureColors(series, cfg);
  const labelRows = labelRowsFor(rows, cfg);

  const stackedData = cfg.chartType === "bar"
    ? d3.stack().keys(series)(rows.map(r => ({ ...r, ...Object.fromEntries(series.map(s => [s, r[s] ?? 0])) })))
    : null;

  const xMax = cfg.chartType === "bar"
    ? (d3.max(stackedData, ss => d3.max(ss, d => d[1])) || 0)
    : (d3.max(rows, r => d3.max(series, s => r[s])) || 0);

  const leftGutter = measureMaxTextWidth(rows.map(d => d.label), cfg, 500) + cfg.labelGutterPad;

  const x = d3.scaleLinear().domain([0, xMax]).nice();
  const ticks = x.ticks(cfg.tickCount ?? 5);
  const maxTickWidth = measureMaxTextWidth(ticks.map(d => d3.format(",")(d)), cfg);
  const rightInset = maxTickWidth / 2 + 4;
  const innerWidth = availableWidth - leftGutter - rightInset;
  x.range([0, innerWidth]);

  const paddingInner = (cfg.barGap * rows.length) / innerHeight;
  const y = d3.scaleBand()
    .domain(rows.map(d => d.label))
    .range([0, innerHeight])
    .paddingInner(paddingInner)
    .paddingOuter(paddingInner / 2);

  const plot = svg.append("g")
    .attr("transform", `translate(${cfg.marginLeft + leftGutter}, ${cfg.marginTop})`);

  plot.append("g")
    .selectAll("line")
    .data(ticks)
    .join("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

  if (cfg.chartType === "line") {
    for (const s of series) {
      const lineGen = d3.line()
        .curve(d3.curveMonotoneY)
        .defined(d => d[s] != null && !isNaN(d[s]))
        .x(d => x(d[s]))
        .y(d => y(d.label) + y.bandwidth() / 2);
      plot.append("path")
        .datum(rows)
        .attr("d", lineGen)
        .attr("fill", "none")
        .attr("stroke", cfg.colors[s])
        .attr("stroke-width", cfg.lineWidth)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round");
      if (cfg.showDots) {
        const present = rows.filter(r => r[s] != null && !isNaN(r[s]));
        plot.append("g")
          .selectAll("circle")
          .data(present)
          .join("circle")
            .attr("cx", d => x(d[s]))
            .attr("cy", d => y(d.label) + y.bandwidth() / 2)
            .attr("r", 4)
            .attr("fill", d => d.color || cfg.colors[s]);
      }
    }
  } else {
    for (const seriesData of stackedData) {
      plot.append("g")
        .selectAll("rect")
        .data(seriesData)
        .join("rect")
          .attr("x", d => x(d[0]))
          .attr("y", d => y(d.data.label))
          .attr("width", d => Math.max(0, x(d[1]) - x(d[0])))
          .attr("height", y.bandwidth())
          .attr("fill", d => d.data.color || cfg.colors[seriesData.key]);
    }
  }

  plot.append("g")
    .selectAll("text.tick")
    .data(ticks)
    .join("text")
      .attr("class", "tick")
      .attr("x", d => x(d))
      .attr("y", innerHeight + 18)
      .attr("text-anchor", "middle")
      .attr("font-variant-numeric", "tabular-nums")
      .attr("fill", "#111827")
      .text(d => d3.format(",")(d));

  plot.append("g")
    .selectAll("line.ytick")
    .data(labelRows)
    .join("line")
      .attr("class", "ytick")
      .attr("x1", -4)
      .attr("x2", 0)
      .attr("y1", d => y(d.label) + y.bandwidth() / 2)
      .attr("y2", d => y(d.label) + y.bandwidth() / 2)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

  plot.append("g")
    .selectAll("text.label")
    .data(labelRows)
    .join("text")
      .attr("class", "label")
      .attr("x", -8)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("font-weight", 500)
      .attr("fill", "#111827")
      .text(d => formatLabel(d.label, cfg));

  plot.append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
}

function updateLoadedFilename() {
  const el = document.getElementById("loaded-filename");
  const name = config.dataFileName;
  if (name) {
    el.textContent = "Loaded: " + name;
    el.hidden = false;
  } else {
    el.textContent = "";
    el.hidden = true;
  }
}

function syncInputsFromState() {
  document.getElementById("input-type").value = config.chartType;
  document.getElementById("input-orientation").value = config.orientation;
  const barGapInput = document.getElementById("input-bar-gap");
  barGapInput.value = config.barGap;
  barGapInput.disabled = config.chartType !== "bar";
  document.getElementById("input-tick-count").value = config.tickCount;
  document.getElementById("input-tick-label-format").value = config.tickLabelFormat ?? "";
  document.getElementById("input-max-labels").value = config.maxCategoryLabels ?? 0;
  const showDotsInput = document.getElementById("input-show-dots");
  showDotsInput.checked = config.showDots !== false;
  showDotsInput.disabled = config.chartType !== "line";
  const lineWidthInput = document.getElementById("input-line-width");
  lineWidthInput.value = config.lineWidth;
  lineWidthInput.disabled = config.chartType !== "line";
  document.getElementById("input-show-legend").checked = config.showLegend !== false;
  document.getElementById("input-legend-position").value = config.legendPosition || "top-left";
  document.getElementById("input-width").value = config.width;
  document.getElementById("input-width-range").value = config.width;
  document.getElementById("input-plot-height").value = config.plotHeight;
  document.getElementById("input-plot-height-range").value = config.plotHeight;
  document.getElementById("input-title").value = config.title;
  document.getElementById("input-subtitle").value = config.subtitle;
  document.getElementById("input-source").value = Array.isArray(config.source) ? config.source.join("\n") : config.source;
  const bg = config.backgroundColor || "";
  document.getElementById("input-bg-color").value = bg || "#ffffff";
  document.getElementById("input-bg-color-hex").value = bg;
  const legBg = config.legendBackground || "";
  document.getElementById("input-legend-bg").value = legBg || "#ffffff";
  document.getElementById("input-legend-bg-hex").value = legBg;
  document.getElementById("input-data").value = dataText;
  const mode = config.dataInputMode ?? "paste";
  document.getElementById("input-data-mode").value = mode;
  document.getElementById("data-paste-wrapper").hidden = mode !== "paste";
  document.getElementById("data-file-wrapper").hidden = mode !== "file";
  updateLoadedFilename();
  renderColorPickers();
}

function wireDimension(numberId, rangeId, key) {
  const numberEl = document.getElementById(numberId);
  const rangeEl = document.getElementById(rangeId);
  const apply = (raw, counterpart) => {
    const v = parseInt(raw, 10);
    if (isNaN(v) || v < 1) return;
    config[key] = v;
    counterpart.value = v;
    render(data, config);
    persistState();
  };
  numberEl.addEventListener("input", (e) => apply(e.target.value, rangeEl));
  rangeEl.addEventListener("input", (e) => apply(e.target.value, numberEl));
}

function wireInputs() {
  syncInputsFromState();

  document.getElementById("input-type").addEventListener("change", (e) => {
    config.chartType = e.target.value;
    document.getElementById("input-bar-gap").disabled = config.chartType !== "bar";
    document.getElementById("input-show-dots").disabled = config.chartType !== "line";
    document.getElementById("input-line-width").disabled = config.chartType !== "line";
    render(data, config);
    persistState();
  });
  document.getElementById("input-orientation").addEventListener("change", (e) => {
    config.orientation = e.target.value;
    render(data, config);
    persistState();
  });
  document.getElementById("input-bar-gap").addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 0) return;
    config.barGap = v;
    render(data, config);
    persistState();
  });
  document.getElementById("input-tick-count").addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 2) return;
    config.tickCount = v;
    render(data, config);
    persistState();
  });
  document.getElementById("input-tick-label-format").addEventListener("input", (e) => {
    config.tickLabelFormat = e.target.value;
    render(data, config);
    persistState();
  });
  document.getElementById("input-show-dots").addEventListener("change", (e) => {
    config.showDots = e.target.checked;
    render(data, config);
    persistState();
  });
  document.getElementById("input-line-width").addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    if (isNaN(v) || v <= 0) return;
    config.lineWidth = v;
    render(data, config);
    persistState();
  });
  document.getElementById("input-max-labels").addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 0) return;
    config.maxCategoryLabels = v;
    render(data, config);
    persistState();
  });
  document.getElementById("input-show-legend").addEventListener("change", (e) => {
    config.showLegend = e.target.checked;
    render(data, config);
    persistState();
  });
  document.getElementById("input-legend-position").addEventListener("change", (e) => {
    config.legendPosition = e.target.value;
    render(data, config);
    persistState();
  });
  wireDimension("input-width", "input-width-range", "width");
  wireDimension("input-plot-height", "input-plot-height-range", "plotHeight");
  document.getElementById("input-title").addEventListener("input", (e) => {
    config.title = e.target.value;
    render(data, config);
    persistState();
  });
  document.getElementById("input-subtitle").addEventListener("input", (e) => {
    config.subtitle = e.target.value;
    render(data, config);
    persistState();
  });
  document.getElementById("input-source").addEventListener("input", (e) => {
    config.source = e.target.value.split("\n");
    render(data, config);
    persistState();
  });
  const bgColorInput = document.getElementById("input-bg-color");
  const bgHexInput = document.getElementById("input-bg-color-hex");
  bgColorInput.addEventListener("input", (e) => {
    config.backgroundColor = e.target.value;
    bgHexInput.value = e.target.value;
    render(data, config);
    persistState();
  });
  bgHexInput.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return;
    config.backgroundColor = v;
    bgColorInput.value = v;
    render(data, config);
    persistState();
  });
  const legendBgInput = document.getElementById("input-legend-bg");
  const legendBgHexInput = document.getElementById("input-legend-bg-hex");
  legendBgInput.addEventListener("input", (e) => {
    config.legendBackground = e.target.value;
    legendBgHexInput.value = e.target.value;
    render(data, config);
    persistState();
  });
  legendBgHexInput.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    if (v && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return;
    config.legendBackground = v;
    if (v) legendBgInput.value = v;
    render(data, config);
    persistState();
  });
  document.getElementById("input-data").addEventListener("input", (e) => {
    dataText = e.target.value;
    data = parseData(dataText);
    config.dataFileName = "";
    updateLoadedFilename();
    renderColorPickers();
    render(data, config);
    persistState();
  });

  document.getElementById("input-data-mode").addEventListener("change", (e) => {
    const mode = e.target.value;
    config.dataInputMode = mode;
    document.getElementById("data-paste-wrapper").hidden = mode !== "paste";
    document.getElementById("data-file-wrapper").hidden = mode !== "file";
    persistState();
  });

  document.getElementById("input-data-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      dataText = text;
      data = parseData(dataText);
      config.dataFileName = file.name;
      updateLoadedFilename();
      document.getElementById("input-data").value = dataText;
      renderColorPickers();
      render(data, config);
      persistState();
      flash(document.getElementById("status"), "Loaded " + file.name + ".");
    } catch (err) {
      console.error(err);
      flash(document.getElementById("status"), "Load failed, see console.");
    } finally {
      e.target.value = "";
    }
  });
}

function hasColorColumn(rows) {
  return !!rows?.columns?.some(c => c.toLowerCase() === COLOR_KEY);
}

function renderColorPickers() {
  const container = document.getElementById("color-pickers");
  container.innerHTML = "";

  // When the data supplies a per-row `color` column it fully controls
  // each bar/dot, so the per-series pickers are moot — hide them.
  if (hasColorColumn(data)) {
    const note = document.createElement("p");
    note.className = "color-note";
    note.textContent = "Colors are set per row by the data’s “color” column.";
    container.appendChild(note);
    return;
  }

  const series = getSeries(data);
  ensureColors(series, config);

  for (const s of series) {
    const row = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = s;
    const colorRow = document.createElement("div");
    colorRow.className = "color-row";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "series-color";
    colorInput.dataset.series = s;
    colorInput.value = config.colors[s];
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "series-color-hex";
    hexInput.dataset.series = s;
    hexInput.value = config.colors[s];
    colorInput.addEventListener("input", (e) => {
      config.colors[s] = e.target.value;
      hexInput.value = e.target.value;
      render(data, config);
      persistState();
    });
    hexInput.addEventListener("input", (e) => {
      const v = e.target.value.trim();
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return;
      config.colors[s] = v;
      colorInput.value = v;
      render(data, config);
      persistState();
    });
    colorRow.appendChild(colorInput);
    colorRow.appendChild(hexInput);
    row.appendChild(label);
    row.appendChild(colorRow);
    container.appendChild(row);
  }
}

function wireToolbar() {
  const status = document.getElementById("status");

  document.getElementById("copy").addEventListener("click", async () => {
    const svg = document.querySelector("#chart svg");
    if (!svg) return;
    try {
      await navigator.clipboard.writeText(svg.outerHTML);
      flash(status, "Copied.");
    } catch (err) {
      flash(status, "Copy failed, see console.");
      console.error(err);
    }
  });

  document.getElementById("download").addEventListener("click", () => {
    const svg = document.querySelector("#chart svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (slugify(config.title) || "chart") + ".svg";
    a.click();
    URL.revokeObjectURL(url);
    flash(status, "Downloaded.");
  });

  document.getElementById("save-json").addEventListener("click", () => {
    const payload = config.dataInputMode === "file" && config.dataFileName
      ? { version: 1, config, dataFile: "data/" + config.dataFileName }
      : { version: 1, config, csv: dataText };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (slugify(config.title) || "chart") + ".json";
    a.click();
    URL.revokeObjectURL(url);
    flash(status, "Saved.");
  });

  const loadInput = document.getElementById("load-json-input");
  document.getElementById("load-json").addEventListener("click", () => {
    loadInput.click();
  });
  loadInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const hasCsv = typeof parsed?.csv === "string";
      const hasDataFile = typeof parsed?.dataFile === "string";
      if (!parsed || typeof parsed !== "object" || !parsed.config || (!hasCsv && !hasDataFile)) {
        throw new Error("Missing config, or csv/dataFile field");
      }
      if (hasDataFile) {
        const res = await fetch(parsed.dataFile);
        if (!res.ok) throw new Error("Could not fetch " + parsed.dataFile);
        dataText = await res.text();
      } else {
        dataText = parsed.csv;
      }
      for (const k of Object.keys(config)) delete config[k];
      Object.assign(config, parsed.config);
      data = parseData(dataText);
      syncInputsFromState();
      render(data, config);
      persistState();
      flash(status, "Loaded.");
    } catch (err) {
      console.error(err);
      flash(status, "Load failed, see console.");
    } finally {
      e.target.value = "";
    }
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (!confirm("Reset chart and discard autosave?")) return;
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
    window.location.reload();
  });
}

function flash(el, msg) {
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 2000);
}

function persistState() {
  try {
    const payload = { version: 1, config, csv: dataText };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Autosave failed:", err);
  }
}

function restoreState() {
  let raw;
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY);
  } catch (_) {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.csv !== "string" || !parsed.config) return null;
    return parsed;
  } catch (err) {
    console.warn("Autosave parse failed, ignoring:", err);
    return null;
  }
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

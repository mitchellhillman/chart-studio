# Project rules

## Adjacent dataset text files (`data/*.txt`)

Each dataset CSV in `data/` may have a sibling `.txt` with the same filename
stem, documenting the chart it drives. Keep it terse and to this exact layout:

- Line 1: chart title (matches the chart's title)
- Line 2: subtitle (matches the chart's subtitle)
- Line 3: blank
- Following lines: one source per line as `Entity: source, locator`. Drop the
  `Entity:` prefix when a single source covers the whole dataset.

Nothing else — no metrics, caveats, theater mappings, or extra prose.

A chart's saved JSON bakes title/subtitle/source in (copied from the `.txt`) and
references the CSV via a top-level `dataFile` path; it does not embed the CSV.

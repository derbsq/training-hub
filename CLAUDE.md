# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build system — open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Deployed via GitHub Pages at `https://derbsq.github.io/training-hub/`.

When the service worker (`sw.js`) is active, bump `CACHE` version string in `sw.js` to force cache invalidation after changes.

## Architecture

Everything lives in a single `index.html` (~2770 lines). No framework, no bundler, no npm. The file is large primarily because of embedded base64 images.

### Structure of index.html

| Line range | Content |
|---|---|
| 1–475 | CSS styles + HTML shell (nav tabs, empty `<section>` view containers) |
| 476 onward | One `<script>` block containing all data and logic |

### Data layer (hardcoded constants)

All training content is defined as JS constants near the top of the script:

- **`SWIM[]`** — swim session objects. Each has `id`, `badge`, `title`, `km`, phases (`ph[]`), drills, stimuli tags.
- **`SCHED{}`** — date-keyed schedule: `'YYYY-MM-DD': [{type:'swim'|'dry', id:'...'}]`
- **`DRY{}`** — dryland sessions keyed by letter (`A`, `B`, `C`). Each has `bw` (bodyweight) and `gym` sub-objects with phases and exercises.
- **`POOLS[]`** — the five Zürich pool locations with their API UIDs.
- **`BADI_TARGETS[]`** — Badi location config mapping pool keys to WebSocket UIDs.

To add a new swim session: add an entry to `SWIM[]`, then reference its `id` in `SCHED`.

### State (`S` object, line ~1078)

Thin localStorage wrapper with typed accessors. All keys are prefixed `hub_`:

| Key | Accessor | Content |
|---|---|---|
| `hub_logs` | `S.logs()` / `S.savelog()` | Training log: `{date: {sessId: {ts, notes, data}}}` |
| `hub_css` | `S.css()` / `S.setcss()` | Critical Swim Speed: `{t200, t400, pace, hist[]}` |
| `hub_exlog` | `S.exlog()` / `S.saveex()` | Exercise performance history |
| `hub_exdone` | `S.isdone()` / `S.toggleex()` | Per-exercise done toggles |
| `hub_gym` | `S.gymmode()` | `'bw'` (bodyweight) or `'gym'` |
| `hub_apikey` | `S.apikey()` | Optional API key |

### Rendering pattern

Each tab is a `<section class="view" data-view="X" id="v-X">`. Tab switches call `switchTab()`. Each view has a dedicated `render*()` function that writes HTML via `.innerHTML` into its section. Views render lazily on first activation and on re-entry.

### External data sources

- **Weather**: `api.open-meteo.com` — Zürich coordinates hardcoded (`47.3769, 8.5417`)
- **Badi live**: WebSocket `wss://badi-public.crowdmonitor.ch:9591/api` (auto-reconnects every 30s)
- **Badi CSV**: `raw.githubusercontent.com/derbsq/Badi-Tracker/main/data/` — two files: `occupancy.csv` (dashboard cards) and `auslastung.csv` (full history for heatmaps/oracle)

The companion repo `github.com/derbsq/Badi-Tracker` is where the occupancy CSV data lives — this app only reads from it.

### CSS variables (design tokens)

Defined in `:root` at the top of `<style>`. Color scheme uses named semantic vars:
- `--swim` (dark green) for swim content, `--dA/dB/dC` for dryland A/B/C, `--bdi` for Badi-Tracker
- `--mono` = DM Mono, `--sans` = Syne (loaded from Google Fonts)

## Key behaviors to know

- **CSS (Critical Swim Speed)**: Calculated as `(t400 − t200) ÷ 2` per 100m. Used throughout swim sessions to generate target paces via `getCSSpace()` + `calcPace()`.
- **Gym mode toggle**: Dryland sessions have two variants (`bw` = calisthenics, `gym` = weights). The active mode is persisted and controls which exercise list renders.
- **Calendar**: Built from `SCHED` — dots on days indicate session types, clicking shows the day's sessions with links into the Swim/Dry tabs.
- **Badi Oracle**: Predicts occupancy using historical CSV data filtered by weekday, school holidays, and Zürich public holidays (`HOLIDAYS_2026`, `SCHOOL_HOLS`).
- **ICS export** (`exportICS()`): Generates a `.ics` calendar file from `SCHED` + `SWIM` data for import into calendar apps.

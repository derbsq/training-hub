# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build system — open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Deployed via GitHub Pages at `https://derbsq.github.io/training-hub/`.

When the service worker (`sw.js`) is active, bump `CACHE` version string in `sw.js` to force cache invalidation after changes. Arc browser requires `Cmd+Shift+R` hard refresh due to aggressive workspace caching.

## Who this is for

Bésko — 39, Zürich. Recreational swimmer at the upper end of ambitious. Follows the Effortless Swimming (ES) Squad Program Level 2. Trains 4 pool sessions/week + 3 dryland sessions. Has access to a calisthenics park and Sportzentrum Josef (gym). Foot condition (sesamoid/big toe area) — no plyometrics on hard surfaces.

This app is his personal training cockpit. It is not a product for other users.

## Swim pacing — critical values

- **CSS (Critical Swim Speed)**: currently ~1:33/100m = 93 sec/100m
- Formula: `CSS = (t400 − t200) ÷ 2` per 100m
- Pace at percentage: `pace_secs = css_secs × 85 / pct` — DO NOT regress this formula
- Key reference paces:
  - 85% CSS = 1:35/100m (threshold)
  - 80% CSS = 1:41/100m
  - 70% CSS = 1:55/100m (Z1/aerobic)
  - 65% CSS = 2:02/100m

## Design principles — strictly enforced

- **No emojis** in functional UI elements, labels, buttons, or navigation
- **No version labels in headers** — version info goes in footer only
- **Consistent padding** across all tabs — no tab should feel wider or narrower than another
- **German UI language** throughout — all labels, buttons, section headers in German
- **Session names shown in full** — no abbreviated badges where full names fit
- **No over-engineering** — this is a single-file app, keep it that way unless there's a compelling reason
- **Regression avoidance** — if something worked before, don't break it while fixing something else
- **Dark theme** — background `#0e0f11`, surface `#161719`, consistent with existing CSS variables

## Typography & visual identity

- `--mono`: DM Mono (Google Fonts)
- `--sans`: Syne (Google Fonts)
- Color tokens: `--swim` (dark green), `--dA/dB/dC` (dryland A/B/C), `--bdi` (Badi)
- Minimalist, information-dense — no decorative flourishes
- Prefer monospace for data/metrics, Syne for headers and nav

## Architecture

Everything lives in a single `index.html` (~2770 lines). No framework, no bundler, no npm. The file is large primarily because of embedded base64 images.

### Structure of index.html

| Line range | Content |
|---|---|
| 1–475 | CSS styles + HTML shell (nav tabs, empty `<section>` view containers) |
| 476 onward | One `<script>` block containing all data and logic |

### Data layer (hardcoded constants)

- **`SWIM[]`** — swim session objects. Each has `id`, `badge`, `title`, `km`, phases (`ph[]`), drills, stimuli tags.
- **`SCHED{}`** — date-keyed schedule: `'YYYY-MM-DD': [{type:'swim'|'dry', id:'...'}]`
- **`DRY{}`** — dryland sessions keyed by letter (`A`, `B`, `C`). Each has `bw` (bodyweight) and `gym` sub-objects with phases and exercises.
- **`POOLS[]`** — Zürich pool locations with API UIDs.
- **`BADI_TARGETS[]`** — Badi location config mapping pool keys to WebSocket UIDs.

### State (`S` object)

Thin localStorage wrapper. All keys prefixed `hub_`. Key accessors:
- `S.logs()` / `S.savelog()` — training log
- `S.css()` / `S.setcss()` — CSS history
- `S.exlog()` / `S.saveex()` — exercise performance
- `S.gymmode()` — `'bw'` or `'gym'`
- `S.apikey()` — Claude API key

### External data sources

- **Weather**: `api.open-meteo.com` — Zürich `47.3769, 8.5417`
- **Badi live**: WebSocket `wss://badi-public.crowdmonitor.ch:9591/api`
- **Badi CSV**: `raw.githubusercontent.com/derbsq/Badi-Tracker/main/data/` — `occupancy.csv` and `auslastung.csv`
- **Limmat flow**: BAFU Station 2099 Unterhard via `api.existenz.ch`
- **Limmat temperature**: `hydroproweb.zh.ch` KW Letten

## Key behaviors — do not break

- **CSS pace formula**: `css_secs × 85 / pct` — this has been corrected before, do not revert
- **Gym mode toggle**: bodyweight vs. gym variants per dryland session, persisted in localStorage
- **Badi Oracle**: kNN + exponential recency weighting `w = 0.70 × similarity + 0.30 × e^(−0.023 × days)`, half-life ~30 days
- **Service worker**: network-first strategy (not cache-first) — fixes Arc browser caching issues
- **ICS export**: RFC5545-compliant, generates from `SCHED` + `SWIM`

## Dryland sessions — structure

Three sessions (A, B, C), each with bodyweight and gym variants:
- **Session A**: Pull & Posterior Chain (Pull-ups, Band Pull-Apart, Face Pull, RDL/Good Morning, Pike/Stir the Pot)
- **Session B**: Push & Rotation (Push-ups, Band Woodchop/Landmine, Hollow Body, Side Plank)
- **Session C**: Legs & Integration (Deadlift/Goblet Squat, KB Swings, Copenhagen Plank, optional Plyometrics)

Plyometrics block: conditional, no jumping on concrete — sesamoid consideration.

## Badi-Tracker companion repo

Lives at `github.com/derbsq/Badi-Tracker`. This app reads from it, never writes to it.

Tracked pools:
- `flb6939` Flussbad Oberer Letten
- `flb6940` Flussbad Unterer Letten
- `fb012` Freibad Heuried
- `LETZI-1` Freibad Letzigraben
- `SSD-11` Freibad Seebach
- `SSD-4` Hallenbad City
- `SSD-7` Hallenbad Oerlikon
- `SSD-10` Seebad Utoquai

Note: Hallenbad City has an **inverse** weather relationship — good weather draws people to outdoor pools, not Hallenbad City.

## Planned features (not yet built)

- **Garmin Connect sync**: via `python-garminconnect` on Railway — pull swim activity data, push structured workouts to Garmin calendar
- **Monthly workout calendar**: auto-generate all sessions as structured Garmin workouts at month start
- **Claude API trainer integration**: system prompt with training science docs + Garmin data, acts as persistent coach
- **Supabase cross-device sync**: replace localStorage with cloud persistence for CSS history, session logs, preferences

## Workflow

- Béško reviews on iPhone (Safari) and Arc browser (different workspaces)
- Changes: edit locally → push to GitHub → GitHub Pages deploys automatically
- No CI/CD beyond GitHub Pages

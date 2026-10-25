# phi-adapt: one shared usage schema ("same data, different faces")

Danny's adaptive golden-ratio principle (2026-10-25, t744u): every page he has built privately learns from how the visitor uses it and
re-weights its load tiers and timing in golden-ratio steps. All pages and bots use **this one schema**, so the questionnaire, the chat page,
the dashboard, Rebella and Ganak's page (and later the prompting) learn from the same signals and express them in different ways.

## Privacy rules (non-negotiable)
- On-device only: `localStorage` on the visitor's own browser. Never sent, synced, logged, published or committed anywhere.
- Only fixed **component ids** and three counters. Never typed text, chat, passwords, names, element text, values, URLs, positions or timestamps.
- `PhiAdapt.clear()` wipes it. A page that cannot use storage simply does not adapt.

## Storage
Key: `phiAdapt.v1` (localStorage). One key per browser origin, so every page on `edgerequals.github.io` (Rebella, the chat page, the
questionnaire, the dashboard) shares the same signals. Per-tab session marker: `phiAdapt.session` in sessionStorage (value `"1"`).

```json
{
  "v": 1,                       // schema version; bump the key (phiAdapt.v2) for breaking changes
  "n": 12,                      // number of sessions seen (all pages)
  "p": { "questionnaire-preview": 9, "index": 3 },   // sessions per page (page = file name without .html)
  "c": {                        // per shared component id
    "rebella-logo": { "o": 2.618, "t": 0.382, "l": 1.0 },
    "dj":           { "o": 0.618, "t": 1.618, "l": 0 }
  }
}
```

- `o` opens: the visitor opened it (a zoom, a pop-over, a dialog: a click on an element with `data-zoom`, `aria-haspopup` or `aria-expanded`).
- `t` taps: any other click inside the component.
- `l` lingers: the component came into view and stayed at least half on screen for PHI^2 = 2.618 s while the page was visible (once per time it comes into view, at most once per PHI^4 = 6.854 s).
- Values are floats rounded to 3 decimals. At most 64 component ids. Ids match `^[a-z0-9-]{1,32}$`.

## The loop (all constants are golden steps; PHI = 1.6180339887)
1. **Decay**: the first time a page runs in a new browser session, every counter is multiplied by 1/PHI (0.618); entries whose total falls under 0.01 are dropped.
2. **Score**: `score = o*PHI + t + l/PHI` (an open weighs one phi step more than a tap, a linger one step less).
3. **Re-rank** (only once the total score reaches PHI^3 = 4.236): each waiting job's key is `position - PHI^2 * score/maxScore`, sorted ascending (stable). A favourite moves up at most ~2.6 places. Jobs marked `first` or `last` never move.
4. **Gap** after a job (quantised): `score/max >= 0.618` -> PHI^-3 = 0.236 s; `< 0.236` -> PHI^-1 = 0.618 s; otherwise PHI^-2 = 0.382 s (the default, also used before there is enough data).
5. Saves are debounced PHI^3 = 4.236 s and flushed on `pagehide` / when the tab is hidden.

## Shared component ids (reuse these names on every page; add new ones here)
| id | what it is | questionnaire selector / job |
|---|---|---|
| `dad-mark` | Dad's equals mark + its zoom and physics | `.q-head [data-zoom="dad"]`; prefetches + `eq-physics.js` (tier 3) |
| `rebella-logo` | Bonnie's Rebella logo + its zoom (bluebird, dawn sky) | `.q-head [data-zoom="rebella"]`; `rebella-glow-lite.css` (tier 3) |
| `dj` | Dad's DJ pill / auto-DJ | `#dj-pill, #qh-djpop, #dad-dj`; `dad-autodj-quiz.js` |
| `status` | Rebella status beacon | `#beacon` |
| `theme` | light/dark switch | `#thm` |
| `tty` | footer tty status bars | `#tty`; `quiz-term-status.js` |
| `ticker` | facts ticker | `#tick` |
| `weather` | weather readout | `#wx, #wxr` |
| `quiz` | the questions (taps only, never answers) | `#quiz` |
| `summary` | the summary panel | `#summary` |
| `foot` | footer | `#foot` |
| `tide` | tide + swell strip | job `tide-swell.js` |
| `space` | space orbit layer + space-loop video | jobs `quiz-space-sweep.js`, `space-loop video` |
| `orbit` | front orbit emojis | job `quiz-front-orbit.js` |
| `rain` | matrix rain (always last) | job `matrix-rain.js` |
| `phi-adapt` | this module itself (always first) | job `phi-adapt.js` |

## Using it on another page
1. Load `js/load-tiers.js` (v>=3) and register heavy parts with a shared id: `LoadTiers.script(url, 2, {id:'dj'})`, `LoadTiers.prefetch(url, {id:'dad-mark'})`, `LoadTiers.add(3, fn, name, {id:'rebella-logo'})`.
2. Add `LoadTiers.script("js/phi-adapt.js?v=1", 2, {first:true, id:"phi-adapt"})` right after load-tiers.js. It runs at idle, after load: no first-load cost.
3. Extend the `MAP` in `js/phi-adapt.js` (or a page-specific copy) with that page's selectors for the shared ids.
4. Other modules may report richer signals: `PhiAdapt.signal('rebella-logo','o')`. Read-only views for other faces and later prompting: `PhiAdapt.score(id)`, `PhiAdapt.rank(ids)`, `PhiAdapt.gap(id)`, `PhiAdapt.snapshot()`.

## Not built yet
- Prompting that self-learns through the same loop (principle point 5).
- Other pages (chat page, dashboard, Rebella, Ganak's page) adopting the module.

# Automata Atlas: notes for Claude Code

An interactive map of the CSCE 4201 Theory of Computing course at AUC (Fall 2026, Dr. Alia El Bolock). It is a bigger-bonus project, due Wed Nov 25, 2026. The content is finished and checked against her slides. **The remaining work is front-end polish and aesthetics.**

## Layout
- `index.html` is the built site and the GitHub Pages entry point: https://boody624.github.io/toc-atlas/ (Pages serves `main`, root).
- `src/` holds the sources. **Edit only `src/`.**
- Build with `python3 src/build.py`. It concatenates `src/shell.html` + `site.css` + `theatre.css` + every JS file (order is set in build.py) into one self-contained `index.html`. There are no dependencies, no npm and no server, and the site works offline from a file.
- Deploy = rebuild, then commit `src/` and `index.html` and push `main`. Pages updates in about a minute.

## Architecture
- It is a single-page app with hash routes: `#home` is the Chomsky-hierarchy map, and `#<stop id>` is a stop.
- `core.js` holds the shared helpers:
  - `h(tag, cls, html)`, `esc`, `svg`
  - `block(parent, kicker, title, id)` makes a section with id `blk-<id>`
  - `quickFire` makes the "A student claims" cards
  - `drawFA` and `faRunner` handle automaton diagrams
  - the `Atlas` object handles stations, `stamp`, `has`, `toast`, and the passport in localStorage key `atlas.passport`
- `home.js` is the stop registry: titles, sessions, blurbs, map x/y coordinates and the region boxes.
- Each stop is one file that sets `Atlas.stations.<id>.mount = function(root){...}` and `.stamps`. The 14 stops and their files are:

  | Stop | File | Sessions |
  |---|---|---|
  | dfa | dfa.js | S2 |
  | min | min.js | S3 |
  | nfa | nfa.js | S4–S6 |
  | mm | mm.js | S7 |
  | regex | regex.js | S9–S11 |
  | closure | closure.js | S12 |
  | pumping | pumping.js | S13 |
  | cfg | cfg.js | S17–S18 |
  | cnf | cnf.js | S18–S19 |
  | pda | theatre.* (the "Pushdown Theatre", its own CSS) | S20 |
  | cyk | cyk.js | S24 |
  | cflpump | cflpump.js | S22–S23 |
  | tm | tm.js | S25 |
  | halt | halt.js | S25+ |

- A stop is usually built in this order: The idea, then Lab, then Challenge (her named in-class activity), then "How it goes wrong" (claims).
- All styling lives in `src/site.css`. The design tokens are CSS variables on `:root`, with dark mode handled there too. The tokens are:
  - `--surface`, `--surface-2`, `--line`, `--ink`, `--muted`
  - `--accept` and `--reject`, each with a `-soft` variant
  - `--now` and `--now-soft`
  - `--sym-A` and `--sym-X`
  - `--mono` and `--r`

## Rules for polishing
- **Do not change course content.** Leave the machines, grammars, counts, notation (αqβ, V(i,j), 7-tuples, ε, the Sipser and Linz S0 rule) and the wording of answers alone. Every number was verified against her slides and model answers.
- Keep it a single self-contained file. External assets are allowed only if they also work offline, and Google Fonts with a fallback is fine.
- After each change, test at widths of 1280 and 375. There must be no horizontal overflow and no console errors. Playwright with chromium works well; check `document.documentElement.scrollWidth - innerWidth === 0` on every route.
- Keep the ids `blk-<id>`, the `.qf-card` structure and the stamp ids, because progress in localStorage depends on them.

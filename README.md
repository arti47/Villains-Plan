# Schemer

A play aid for **"The Villain's Plan"** (*Mythic Magazine* vol. 69, pp. 16–28): reveal a
villain's scheme one layer at a time, roll the End Goal when the odds catch up with you,
and keep the dossier that results.

It is a single-seat tool for a solo player emulating a GM. It tracks a *plan*, not a
character — the article has no attributes, no combat and no sheet, and nothing here
invents any.

## Running it

There is no build step. Clone and open `index.html` over HTTP:

```sh
python3 -m http.server 8000      # or: npx http-server
# then open http://localhost:8000
```

Opening the file directly with `file://` will not work — the app is ES modules and a
service worker. On a phone, add it to the home screen: it is an installable PWA and works
offline.

Everything is stored in your browser's `localStorage`. Settings → Export writes plain JSON
you can read, keep and import on another device. Nothing is sent anywhere; there is no
account, no server and no telemetry.

## What it does

- **Dossier** — the villain, every reveal with the dice that produced it, your reading of
  each one, and the leads still open.
- **Reveal** — earn a reveal (your judgement, never a roll), and the app runs the End Goal
  Roll, the Focus table and the two keywords in the order the rules ask for.
- **Arc** — Discovery → Foiling → Pivot → Concluded, with a summary and one-step undo at
  every boundary, and the Pivot gate the article defines.
- **Log** — every die it has rolled, with a per-face distribution so you can check the app
  rather than argue with it.
- **Rules** — one entry per automated rule in the app's own words, with the page cited, a
  first-session tutorial, and an honest list of what the app deliberately does not do.

## What it does not do

This article is one subsystem of Mythic, not the whole of it. Fate Questions and their
odds, the Chaos Factor, scene setup, Bookkeeping, Discover Meaning, Random Events and the
Threads and Characters lists live in the core rules, so the app neither rolls them nor
approximates them. Where the subsystem calls for a Fate Question — the surprise route to a
Plan B — the app asks you for the answer you resolved elsewhere, and then honours it.

## Development

```sh
npm test              # parse gate, data and engine invariants, dead-data scan (seconds)
npm run smoke         # browser smoke: every route, three seed states, the layout contract
npm run interaction   # clicks every visible control in isolation
npm run probe         # prints the layout and flow tables — read them, they do not assert
node tests/make-fixtures.mjs   # regenerate the shared seed states
```

Chromium comes from Playwright. `CLAUDE.md` is the canonical spec — the System Profile,
the rulings, the ledgers and the process rules — and is updated in the same change as the
code. Findings live in `docs/AUDIT.md`; the distilled rules the audit reads against the
engine are in `docs/rules/`.

## Multiplayer

Not built. `firebase-config.js` and `database.rules.json` carry the Phase 5 shape so it
needs no migration later, and `FIREBASE_ENABLED` is `false`. A GM-emulator tool is
single-seat by nature; if that ever changes, note that Firebase RTDB gives offline and
multi-device but not longevity, privacy from the provider, or conflict-free collaboration.

## Licensing and the source

This is a **personal play aid built from the owner's own copy of the magazine**. It carries
mechanics and numbers, with every piece of prose rewritten; no setting, adventure or art
content is included. If you publish or distribute it, the licensing is your
responsibility — openly licensed material is the safe basis for anything public. The
repository carries a transcription of a commercial article, so keep it private.

"The Villain's Plan" is by Tana Pigeon, published in *Mythic Magazine* vol. 69 by Word Mill
Games. This app is unaffiliated with and unendorsed by Word Mill Games.

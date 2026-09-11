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

- **Scene** — Mythic's own loop: write what you expect, roll a d10 against the Chaos
  Factor, and get the scene you pictured, a twisted one, or an interruption. Ending a scene
  runs bookkeeping: it moves the Chaos Factor and points you at the lists.
- **Lists** — Threads and Characters, twenty-five lines each, with the weighting that makes
  the busiest parts of your story likeliest to come back, and a Thread Progress Track for
  the one goal you want to drive to a conclusion.
- **Villain** — the Villain Crafter: an archetype for who the villain is, the Elements
  tables for who they actually are (identity, skills, motivations, personality, appearance,
  traits and flaws, background), a shape for the organization behind them, and rolls for the
  lieutenants and minions your character will meet. Each roll carries a modifier into the
  next and the app shows the sum.
- **Dossier** — the villain, every reveal with the dice that produced it, your reading of
  each one, and the leads still open.
- **Reveal** — earn a reveal (your judgement, never a roll), and the app runs the End Goal
  Roll, the Focus table and the two keywords in the order the rules ask for.
- **Arc** — Discovery → Foiling → Pivot → Concluded, with a summary and one-step undo at
  every boundary, and the Pivot gate the article defines.
- **Oracle** — Ask the Game Master on Mythic's full Fate Chart: a Yes/No question, honest
  odds, one d100 read at your current Chaos Factor, so the same roll answers differently in
  a calm adventure and a wild one. A double also throws a random event — an Event Focus and
  two Action words. Discover Meaning covers detail without a question, across both Action
  tables and all twelve Elements tables. Switch it off in Settings if you roll by hand.
- **Log** — every die it has rolled, with a per-face distribution so you can check the app
  rather than argue with it.
- **Rules** — one entry per automated rule in the app's own words, with the page cited, a
  first-session tutorial, and an honest list of what the app deliberately does not do.

## What it does not do

Six sources are in here: the Villain's Plan article, the One-Page Mythic Game Master
Emulator, the Villain Crafter, and from Mythic Second Edition the Elements and Action
meaning tables, the Fate Chart, the Random Event Focus and Scene Adjustment tables, and the
scene/Chaos Factor/bookkeeping rules. That last part arrived as a written summary rather
than pages, so what still rests on it ships marked provisional and the Scene screen says so.

The Fate Check is in: an adventure resolves on the Fate Chart or on the Check, whichever
you pick. Mid-Chaos comes with it — its Check modifiers are quoted, so the mode is offered
there and refused on the chart, whose Mid-Chaos cells were not supplied. The Discovery
Check is in too, with the caveat that four of its eight results are printed with no stated
effect, so the app rolls them, names them and applies nothing.

Still not in: the Mid-Chaos Fate Chart's cells, and what those four Discovery results do.
The app does not approximate either. The Chaos Factor (which the one-page edition drops by
design), scene setup, the Bookkeeping phase and the Threads and Characters lists are in
none of them, so the app does not roll them and does not approximate them. Villain
statistics are also left alone: no game system is attached here.

Every table in here is read from its page. Three bands of the Villain Crafter's Minion
column were unreadable in the first pass and the app said so rather than inventing them;
page photographs closed that gap, and nothing ships guessed at.

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

"The Villain's Plan" (*Mythic Magazine* vol. 69), "The Villain Crafter" (vol. 41) and the
One-Page Mythic Game Master Emulator are by Tana Pigeon, published by Word Mill Games. This
app is unaffiliated with and unendorsed by Word Mill Games.

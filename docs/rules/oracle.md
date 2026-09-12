# The Mythic oracle — Ask, events, meaning

Distilled from the One-Page Mythic Game Master Emulator (`OPM`) and, for everything from
the Fate Chart on, *Mythic Game Master Emulator Second Edition* (`GME2e`). Together they
supply exactly what the Villain's Plan article leans on and does not contain.

## Ask The Game Master — the Fate Chart

Form a Yes/No question, know what you expect, assign odds, roll 1d100, read the cell at
your **Chaos Factor**. The engine reads `data-fate-chart.js` — 81 cells, nine odds rows by
nine chaos columns, each cell `[exceptionalYes, yes, exceptionalNo]` with `null` for the
chart's "x" (that result cannot happen at those odds and that chaos).

Chaos moves the answer: a 50 at 50/50 is a No at chaos 1 and a Yes at chaos 9.

**The chaos-5 column is the One-Page Mythic chart below**, cell for cell — two separate
transcriptions of the same table, asserted against each other by test. The table that
follows is therefore both the OPM chart *and* the Fate Chart's middle column.

| Odds | Exceptional Yes | Yes | No | Exceptional No |
|---|---|---|---|---|
| Certain | 1–18 | 19–90 | 91–98 | 99–100 |
| Nearly Certain | 1–17 | 18–85 | 86–97 | 98–100 |
| Very Likely | 1–15 | 16–75 | 76–95 | 96–100 |
| Likely | 1–13 | 14–65 | 66–93 | 94–100 |
| 50/50 or Unknown | 1–10 | 11–50 | 51–90 | 91–100 |
| Unlikely | 1–7 | 8–35 | 36–87 | 88–100 |
| Very Unlikely | 1–5 | 6–25 | 26–85 | 86–100 |
| Nearly Impossible | 1–3 | 4–15 | 16–83 | 84–100 |
| Impossible | 1–2 | 3–10 | 11–82 | 83–100 |

- Data: `FATE_CHART` (engine), `ASK_ODDS` (retained as the corroborating chaos-5
  transcription). Engine: `rules.askResult` / `rules.fateBands`. Surface: the Ask screen,
  with the bands drawn to scale for your odds **at your current chaos**, before you roll.
- Every row is asserted to cover 1–100 exactly once, and the published boundaries
  (10/11, 50/51, 90/91 at 50/50) are pinned by test.
- 50/50 is the default on every visit, and unknown odds fall back to it rather than to a
  guess (ruling A11).

## The four answers

Yes and No return you to the expectation you held when you asked; the Exceptional results
go past it in the same direction. A No you cannot read sends you to Discover Meaning, not
to a re-roll — the app prints that route on every No.

## Random events — Exception on the Ask roll

A double-digit result (11, 22 … 99) fires a Random Event as well as the answer. 100 is not
a double (ruling A12).

Two rolls build one: the **Event Focus** (d100, twelve bands) says what kind of thing
happens, then **Action 1 + Action 2** say what it is. Where the focus names a thread or an
NPC, the app offers a roll on that list rather than choosing for you — which entry fits is
a reading, not a lookup.

- Engine: `rules.askResult().double` → `oracle.rollEvent`.
- The answer still stands. The event is read into the same moment, not instead of it.
- The focus table ships with the book's own "when you would choose this" note per row,
  shown in a fold on the Ask screen.

## Discover Meaning — Lookup ×2 columns, with an unbounded repeat

Fifty rows, two columns, 1d100. Action for what an active element does; Description for
what something is like. One word is often enough; roll another when it is not, for as long
as it takes.

- Engine: `rules.discoverWord`, `oracle.discover`. Each roll is logged on its own.
- Nothing rolls a second word automatically (ruling A15) — the repeat is a control.

## The Fate Check — the alternative

Not an addition to the chart: the book offers it *instead*. Roll 2d10 and add them, plus
the odds modifier (Certain +5 … Impossible −5) and the Chaos Factor modifier (+5 at chaos 9
… −5 at chaos 1). Then:

| Total | Answer |
|---|---|
| 18 or more | Exceptional Yes |
| 11 or more | Yes |
| 5 to 10 | No |
| 4 or less | Exceptional No |

The printed table gives 18–20 and 2–4, which are the ranges of an *unmodified* 2d10; with
modifiers a total runs −8 to 30, so the app reads the table as thresholds (ruling A34).

A random event fires when **both dice match and that number is at or under the Chaos
Factor** — so a double 10 never fires one, because chaos stops at 9.

Which resolution an adventure uses is a setting on the Ask screen, and **every chaos mode
works on both**. On the Check the variants arrive as smaller modifier ladders: Mid-Chaos
runs +2 at chaos 9 down to −2 at chaos 1, Low-Chaos +1 down to −1. Both are the standard
ladder compressed — Mid-Chaos is the standard ladder at chaos 7/6/5/4/3, Low-Chaos at
6/5/4 — so a variant narrows chaos's swing without changing the arithmetic.

## The four charts

The book prints a separate Fate Chart for each variant, and what differs is the columns:

| Chart | Columns | A 50/50 Yes runs |
|---|---|---|
| Fate Chart | one per Chaos Factor (9) | 1-10 to 1-90 |
| Mid-Chaos | 1 · 2-3 · 4-6 · 7-8 · 9 | 1-25 to 1-75 |
| Low-Chaos | 1-2 · 3-7 · 8-9 | 1-35 to 1-65 |
| No-Chaos | one, for any chaos | always 1-50 |

Every variant column turns out to be a column of the standard chart copied whole —
Mid-Chaos is its columns 3 to 7, Low-Chaos 4 to 6, No-Chaos column 5 alone. The app reads
each chart's own printed cells; that equivalence is asserted by the suite, which is how 117
transcribed cells check each other. It also settles ruling A31 with a printed page: No-Chaos
was read at column 5 on the reasoning that a chart whose columns *are* the modifier has its
neutral at 5, and the No-Chaos chart is exactly column 5.

## The Action tables

Two d100 columns rolled together: what happens, and what it happens to. They are a random
event's meaning, and they are what The Villain Crafter means by "roll on Mythic's Action
Meaning Tables" (ruling A17, revised — it used to route to One-Page Mythic's condensed
Action column).

## Where this touches the Villain's Plan

The article's surprise route to a Pivot Plan asks a Fate Question. With this source in
hand the app can roll it (ruling A14, revising A7): the Arc screen offers the odds and the
question, and whatever lands is written to `fateAnswer`, which the pivot gate already
honoured — a No blocks the pivot roll. A table using physical dice can still record the
answer by hand.

## Still not supplied

Nothing in the oracle. Everything this section once listed — the Chaos Factor, scene setup,
Bookkeeping, the two lists, the Villain Crafter — has since arrived and is built. The one
gap left in the whole app is what four results on the Thread Discovery Check table do; see
`scenes.md`.

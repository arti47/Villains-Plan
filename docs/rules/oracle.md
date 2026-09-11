# The Mythic oracle — Ask, events, meaning

Distilled from the One-Page Mythic Game Master Emulator (Word Mill Games), cited `OPM`.
This is the second source, and it supplies exactly what the Villain's Plan article leans
on and does not contain.

## Ask The Game Master — Lookup

Form a Yes/No question, know what you expect, assign odds, roll 1d100, read the row.

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

- Data: `ASK_ODDS`. Engine: `rules.askResult`. Surface: the Ask screen, with the bands
  drawn to scale for the odds you picked, before you roll.
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

- Engine: `rules.askResult().double`; `oracle.ask` then rolls the event word.
- The app rolls one **Action** word for the event and offers another (ruling A13): an event
  is what happens, and "get more words" is the book's own escape hatch.
- The answer still stands. The event is read into the same moment, not instead of it.

## Discover Meaning — Lookup ×2 columns, with an unbounded repeat

Fifty rows, two columns, 1d100. Action for what an active element does; Description for
what something is like. One word is often enough; roll another when it is not, for as long
as it takes.

- Engine: `rules.discoverWord`, `oracle.discover`. Each roll is logged on its own.
- Nothing rolls a second word automatically (ruling A15) — the repeat is a control.

## Where this touches the Villain's Plan

The article's surprise route to a Pivot Plan asks a Fate Question. With this source in
hand the app can roll it (ruling A14, revising A7): the Arc screen offers the odds and the
question, and whatever lands is written to `fateAnswer`, which the pivot gate already
honoured — a No blocks the pivot roll. A table using physical dice can still record the
answer by hand.

## Still not in either source

The Chaos Factor (the one-page edition drops it by design), scene setup, the Bookkeeping
phase, Threads and Characters lists, and the Villain Crafter. Listed in the rules library
and never approximated.

# Scenes, the Chaos Factor, bookkeeping and the two lists

From the Mythic Game Master Emulator Second Edition, cited `GME2e`.

## Provenance — read this first

**This source was supplied as a written summary, not as page images.** Under §2.1 a
summary corroborates and never decides, so everything below ships marked
`provisional: true` in `data-scenes.js`, the Scene screen carries a fold saying where the
rules came from, and a page image can confirm or correct any of it. What the summary
*names* without specifying is not implemented and not approximated — see the bottom of
this file.

## The Chaos Factor

One to nine, starting at five. It is the number the scene test is rolled against.

- Data: `CHAOS`. Engine: `rules.clampChaos`, `scenes.endScene`.
- Surface: the persistent header (it decides what the next scene does), and a nine-step
  track on the Scene screen.
- **It does not touch the app's Ask The Game Master odds** (ruling A24). GME2e's Fate Chart
  moves with chaos; One-Page Mythic's chart — the one that ships — has no Chaos Factor in
  it, and the Fate Chart itself was not supplied. A test asserts the ask path never reads
  chaos, and that the same roll gives the same answer at chaos 1 and chaos 9.

## The scene test

Roll 1d10 against the Chaos Factor:

| Roll | Result |
|---|---|
| Over the Chaos Factor | **Expected** — the scene opens as you pictured |
| At or under, **odd** | **Altered** — the same scene, twisted |
| At or under, **even** | **Interrupt** — something else happens instead |

- Engine: `rules.sceneOutcome`, asserted across all 90 roll/chaos combinations.
- The expectation is written **before** the roll, because the other two outcomes are
  defined against it. The screen asks for it first.

## Altered scenes

Take the next most likely version, or twist one element. GME2e has a Scene Adjustment
Table; **its ranges were not supplied**, so the app offers the kinds of adjustment the
summary names as choices and does not roll them (ruling A23). "Ask the Game Master" and
"roll a meaning word" are on that list and route to the engines the app already has.

## Interrupt scenes

Built like a random event. Mythic rolls an Event Focus first; **that table was not
supplied**, so the app rolls meaning words — the One-Page Mythic random-event shape — and
says on the card that the focus is yours to decide.

## Bookkeeping

Two steps, fired as one boundary with a summary and one step of undo, like the arc
boundaries:

1. **Update the lists** — add what the scene introduced, weight what was prominent, cross
   out what is finished.
2. **Adjust the Chaos Factor** — in control drops it one, out of control raises it one,
   clamped to 1–9. The summary says so rather than silently doing nothing at the ends.

## Threads and Characters

Twenty-five lines each, five sections. Threads are goals (Mythic never invents one for
you). Characters are people — and places, objects, or recurring events, anything that
should be able to walk into a scene.

- **Weighting**: something prominent earns another line, to a maximum of three. The cap is
  enforced in normalization, so no path can exceed it.
- **Crossing out** frees every line an element held.
- **Clean-up** when the sheet is full: live elements carry across and three-line ones come
  over with two.
- **Picking at random is a house aid** (`data-house.js`, `HOUSE_AID = true`, labelled in
  the UI): Mythic's own selection roll was not supplied. Every *line* is equally likely,
  which is precisely what makes the book's weighting bite — a test asserts a three-line
  element comes up about three times as often as a one-line element.

## Named in the source, not supplied — so not built

The Fate Chart's odds by Chaos Factor · the Event Focus table · the Scene Adjustment
Table's ranges · the Thread Progress Track · the Mid-Chaos, No-Chaos and Random Chaos
variants. All listed in the rules library and on the Scene screen.

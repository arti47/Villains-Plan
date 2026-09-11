# Scenes, the Chaos Factor, bookkeeping and the two lists

From the Mythic Game Master Emulator Second Edition, cited `GME2e`.

## Provenance — read this first

**This subsystem arrived as a written summary first**, and shipped with every value marked
provisional. The scene test, the Scene Adjustment Table and the Event Focus table were then
confirmed or supplied as photographs; the Chaos Factor, list and bookkeeping rules were
confirmed by direct quotation — which also **corrected the clean-up rule** (F41). Those
flags are gone. The only summary-only rule left is how a random event picks an entry from a
list, which keeps its flag and its recorded inference. Under §2.1 a
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
- **It moves the ask odds** (ruling A24, revised). The Fate Chart arrived, so the ask reads
  the adventure's Chaos Factor and the chart column for it: a 50 at 50/50 is a No at chaos
  1 and a Yes at chaos 9.

## The scene test

Roll 1d10 against the Chaos Factor:

| Roll | Result |
|---|---|
| Over the Chaos Factor | **Expected** — the scene opens as you pictured |
| (a 10 always clears: chaos never exceeds 9, which is why the book's even list stops at 8) | |
| At or under, **odd** | **Altered** — the same scene, twisted |
| At or under, **even** | **Interrupt** — something else happens instead |

- Engine: `rules.sceneOutcome`, asserted across all 90 roll/chaos combinations.
- The expectation is written **before** the roll, because the other two outcomes are
  defined against it. The screen asks for it first.

## Altered scenes

Roll 1d10 on the Scene Adjustment Table: remove a character (1), add one (2), reduce or
remove an activity (3), increase one (4), remove an object (5), add one (6), and on 7–10,
**make two adjustments** — roll twice more. The book does not say what a nested 7–10 does;
the app expands it the same way, which converges (branching factor 0.8) and is guarded at
depth 4 (ruling A27). Asking the Game Master and rolling a meaning word sit beside it.

## Interrupt scenes

Built exactly like a random event: the Event Focus, then two Action words. *Move Toward A
Thread* is the book's own suggestion for an interrupt — the adventure has stalled and this
is the push.

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
- **Clean-up** when the sheet is full: every kept element carries across with **one** line,
  except ones holding three, which carry across with two (`{1:1, 2:1, 3:2}`). The app had
  this wrong from the summary — twos stayed at two — until the book's own wording corrected
  it. A test pins all three cases and asserts a full list always frees room.
- **Rolling on a list** is the book's own two-step procedure (ruling A25, revised — the
  house aid that stood in for it was deleted with the gap): a section die sized to the
  active sections (none / d4 / d6 / d8 / d10), then 1d10 for the line, two faces per line.
  A blank line reads **Choose**: take what fits, or roll again. Weighting still decides how
  often an element comes up, because it holds more lines.
- One inference is recorded in the data (A28): the summary gives the section die but not
  how its faces map to sections, so the app pairs them the way the line roll is explicitly
  paired. Confirm from the page.

## The Thread Progress Track

Pick one active thread as the focus and give it a track of 10, 15 or 20 points. Any
progress toward it in a scene is 2 points; a flashpoint — a dramatic event directly
involving it — is another 2.

- **Phases of five.** The track is divided into 5-point phases, each carrying the book's
  question: *did a flashpoint happen in it?* If one has not by the time you cross out of
  the phase, the track **makes** one happen — a random event with an automatic focus of
  Current Context, involving the thread dramatically without resolving it. A moment can
  count as both progress and a flashpoint; either is 2 points, but calling it a flashpoint
  satisfies the phase, which is the book's own worked example (6 points, flashpoint
  already had, no trigger).
  - **Timing matters.** Cross the threshold mid-scene and the flashpoint fires there and
    then. Cross it during end-of-scene bookkeeping and it lands at the start of the next
    scene — which you still generate and test as normal; it just carries the flashpoint.
    The app stores that as `pendingFlashpoint` rather than firing it retroactively.
  - The app derives each phase's flashpoint from the award history, so there is no
    checkbox to forget to tick: a flashpoint counts for the phase the running total was
    in when it was scored.
- **Plot armour** is a Gate: until the track fills, that thread cannot be resolved. The
  app refuses to cross it out and says why. It reaches further than the track screen: a
  random event whose focus is **Close A Thread** is played out as normal, but with the
  added context that this thread does not actually close. The event block says so
  whenever that focus comes up with an unfinished track.
- **The Conclusion** is "a flashpoint with the plot armour removed": a random event with an
  **automatic** Event Focus of Current Context (no focus die) plus two Action words, read
  toward something that ends the thread. If it fits the scene that triggered it, it happens
  there. If not it waits for the next scene — and **that scene is not tested against the
  Chaos Factor**, because the track has already guaranteed it begins as you imagine it.
  That is the only scene in the app with no test die, and the guarantee is spent once.
- The **Discovery Check** is for when forward momentum has stalled and you are out of
  ideas: your character does something that gives a discovery a chance, and you ask whether
  something is discovered at odds of **no less than 50/50**. The answer does more than
  decide yes or no:

  | Answer | What it buys |
  |---|---|
  | Exceptional Yes | Roll **twice** on the table and combine |
  | Yes | Roll once |
  | No | Nothing found |
  | Exceptional No | Nothing found, **and no further Discovery Check this scene** |

  The Exceptional No is the only one with a lasting effect — a dead end the character has
  to leave and come back to in a later scene. The app records it on the scene, so the next
  scene opens Discovery again.

  When you do roll, it is 1d10 plus your current progress points — and the roll **is** a
  random event, with this table standing in for the Event Focus table, so the app rolls
  meaning words with it to be read the same way. Four of the eight results — Progress +2, Flashpoint +2,
  Progress +3, Flashpoint +3 — award points. **The other four (Track +1, Track +2,
  Strengthen Progress +1 and +2) are printed with no stated effect**, so the app rolls
  them, names them, and applies nothing (ruling A33).

## Chaos variants

- **Standard** — the Chaos Factor moves by whether the characters held control.
- **No-Chaos** — questions read the chart's middle column, so the odds alone decide, while
  chaos keeps running underneath for scene tests and events (ruling A31: on a chart whose
  columns *are* the modifier, the neutral column is 5 — which the book itself calls the
  "default, middle of the road percentiles").
- **Random Chaos** — at the end of a scene roll a d10: equal-or-under drops the Chaos
  Factor by one, over raises it. Bookkeeping stops asking about control and rolls instead.
- **Mid-Chaos** trims the extremes: the nine Chaos Factors collapse into five columns
  (1, 2-3, 4-6, 7-8, 9), so chaos pulls a question by +2 to −2 instead of +5 to −5.
- **Low-Chaos** goes further: three columns (1-2, 3-7, 8-9), a pull of +1 to −1.

All three variants have their own printed Fate Chart *and* their own Fate Check modifier
ladder, so each works under either resolution — see `oracle.md` for the four charts side by
side. Each variant chart turns out to be a slice of the standard one, which the suite
asserts cell for cell.

## A question standing in for a game rule

Quoted: "Treat the Chaos Factor as a value of 5 for these Questions, regardless of what the
actual Chaos Factor value is right now." A checkbox on the Ask screen, so a to-hit roll is
not skewed by the story's tension.

## Still not supplied

Nothing. All eight Discovery results award points — 2, 2, 1, 3, 3, 2, 1, 2 reading down.
**Track +1/+2** means you found nothing useful but the act of trying moved you along;
**Strengthen Progress +1/+2** means earlier progress was reinforced, read as a discovery
that ties back to one already made. `NOT_SUPPLIED` is now empty, and the suite asserts
that it is — if a rule ever arrives that the app cannot build, it goes there with an
assertion in the same change (`docs/AUDIT.md` F45). Listed in the rules library and on the Scene screen.

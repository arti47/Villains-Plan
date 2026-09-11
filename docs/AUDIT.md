# Audit log

Findings are numbered, with **Rule / Target / Fix / Why it mattered**. The verified-clean
list stops later passes re-litigating settled ground. Stopping rule: one complete cycle of
all seven pass types with no finding (template §11.4).

## Cycle 1

### F1 · Parse gate caught two unbalanced calls before they ever rendered
- **Target:** `src/sheet.js:earnedGuidance`, `src/screens.js:examplesCard`
- **Fix:** closing parens added.
- **Why it mattered:** a missing paren in a screen module does not throw in the browser —
  it presents as a screen that never renders. Both were written by hand and both parsed
  only because `node --check` ran on every file. Cost: one second per run.

### F2 · Dead exports in `rules.js`
- **Target:** `focusTables`, `plotTwists`, `FOCUS`
- **Fix:** deleted the unused wrappers; `FOCUS` unexported behind `focusTableFor`.
- **Why it mattered:** three ways to reach the same tables is three places to drift.

### F3–F6 · Exported but never imported
- **Target:** `core.clamp`, `derived.nextArc`/`arcStageIndex`, `ui.sourceCite`,
  `store.normalizeState`
- **Fix:** deleted or unexported.
- **Why it mattered:** dead-data scan, pass one. None were rules, but each was a surface
  a later change would have been tempted to build against.

### F7 · The End Goal threshold was written as a literal in two places
- **Rule:** `d10 + 2 per phase ≥ 11` (MM69:p22)
- **Target:** the persistent header's tooltip and the Reveal screen's `explain()` copy
- **Fix:** both read `endGoalRule()`; the unit harness now fails on a literal `11` in `src/`.
- **Why it mattered:** copy that states a mechanic must be enforced or marked guidance
  (§10.1). These stated the mechanic and would have gone stale silently.

### F8 · `store.updateAdventure` had no caller — the app could not rename an adventure
- **Fix:** a Rename control on each adventure row.
- **Why it mattered:** the scan found a missing *feature*, not dead code: with a campaign
  list, the working title you type in the wizard is permanent otherwise.

### F9 · The two bans read prose, not code
- **Target:** `tests/unit.mjs`
- **Fix:** comments and block comments are stripped before the `Math.random(` and
  threshold checks run.
- **Why it mattered:** the library entry that *explains* the crypto RNG tripped the ban on
  it. A check with false positives gets disabled by the next person.

### F10–F12 · Two counters for one count
- **Target:** `planPhases(adv).length` in five call sites
- **Fix:** all read `derived.phaseCount`.
- **Why it mattered:** §10.12 — a count that drives a procedure is stored and derived once.

### F13 · A unit test rolled real dice and could flake
- **Target:** the renumbering test
- **Fix:** builds its phases with `store.addPhase`.
- **Why it mattered:** a second *rolled* reveal legitimately fires the End Goal 20% of the
  time. The test would have failed one run in five, which is how a harness loses its
  credibility (D-15).

### F14 · `GUIDANCE.interpret`, `GUIDANCE.noContext` and `GUIDANCE.pivotTiming` were extracted and never shown
- **Fix:** surfaced on the Reveal screen, on the No Context note, and on the Arc screen.
- **Why it mattered:** §0 exactly — data extracted, unit-tested, never called. A new unit
  test now asserts every guidance key appears in a view module.

### F15 · The interaction audit indexed visible controls and clicked unfiltered ones
- **Target:** `tests/interaction.mjs`
- **Fix:** the nth visible control is marked in the page itself, so both passes enumerate
  identically; off-canvas controls (the skip link) are not counted as visible.
- **Why it mattered:** it produced 23 findings, every one of them a click on a hidden node
  inside a collapsed panel. A harness that manufactures findings is worse than no harness.

### F16 · Filter chips did not say they were pressed
- **Fix:** `aria-pressed` on the log filters, theme chips, text-size chips and the
  fate-answer buttons.
- **Why it mattered:** a screen reader could not tell which filter was active, and the
  audit could not tell a legitimate no-op from a broken control.

### F17–F18 · Controls that did nothing
- **Target:** the persistent header's stats, the "Next" banner, and the brand link
- **Fix:** a stat or banner that points at the screen you are already on renders as text,
  not a link; the brand carries `aria-current` on the dossier.
- **Why it mattered:** four dead links on the most-visited screen (D-... the no-op class
  the interaction audit exists to find).

### F19 · The dossier was 9.2 viewports and 107 controls at session-three density
- **Target:** `sheet.renderDossier`
- **Fix:** the newest reveal stays open; earlier ones collapse to a line carrying their
  name, focus, keywords and open-lead count; the list pages at 8.
- **Why it mattered:** measured, not noticed — the screen is fine with three reveals and
  unusable with ten (D-9). After: 2.3 viewports, 22 controls.

### F20 · A recorded Fate Question answer was written, displayed, and read by nothing
- **Rule:** "No or Exceptional No they don't" (MM69:p26)
- **Target:** `derived.canRevealPivot`
- **Fix:** a recorded No blocks the pivot roll, with a refusal that cites the answer; a Yes
  re-opens it.
- **Why it mattered:** the rules read-through found it, not a scan: the flag had a setter
  and a reader-for-display, which looks finished (D-4).

### F21 · "Villain Behind the Villain" is a permission with no control
- **Rule:** End Goal Focus 73–76 (MM69:p22)
- **Target:** `sheet.villainBehindStep`, `villain.behind` in the schema
- **Fix:** when that row comes up, the End Goal card offers a control to name who is really
  behind it; the field is on the dossier and back-fills on old records.
- **Why it mattered:** D-22 — the book grants a permission and it reads as flavour. Every
  other End Goal row resolves to text; this one asks you to *decide something* and the app
  was silently dropping it.

### F22 · The session record grew without bound
- **Fix:** paged at 25, like the roll log.

## Verified clean (cycle 1)

- **Data values.** Every row of all four tables checked against `docs/villains-plan.md`;
  ranges are contiguous, 1–100, with unique keys; the hundred keywords are unique and 14
  of them are pinned by the article's own worked examples.
- **The threshold ladder.** `[impossible, 9+, 7+, 5+, 3+, any]` asserted, including the
  boundary (10 does not fire, 11 does) and 200 first reveals that can never be the End Goal.
- **Dice.** Cryptographic source, rejection-sampled; 2,000 rolled checks stay inside 35% of
  expectation per face; no `Math.random` call ships.
- **Re-rolls.** No path produces a second roll for one action: asserted across a route
  change, and the only re-roll control confirms and logs itself.
- **Once-per-X.** No second End Goal; one pivot; the override clears on use and on reload.
- **Migration.** A hand-written old-shape record loads: ids minted, arc defaulted, ordinals
  recomputed, empty leads dropped, spent override cleared.
- **Export.** Round-trips; rubbish is refused without destroying what is there.
- **Layout.** Zero horizontal overflow at 320/360/390 on ten routes in three seed states;
  no tap target under 40px measured on the wrapping label; every input ≥16px; every screen
  has a collapsed `explain()` note; the primary action is on screen everywhere it exists.
- **Interaction.** 215 controls clicked in isolation with storage reset between clicks:
  no JS error, nothing unclickable, nothing that changes nothing.
- **Flow.** Earn and read a reveal, 3 taps. Add a lead, 2. Resolve a lead, 1. Start an
  adventure, 3. Switch adventure, 1. No terminal state without an onward route.

## Cycle 2 — after adding One-Page Mythic

The second source (Ask The Game Master, Random Events, Discover Meaning) went in with the
same passes run against it.

### F24 · Six tabs do not fit a 320px phone
- **Target:** the tab bar, after the Oracle tab made it six
- **Fix:** Settings moved to a section of the Rules tab plus a corner control (§6.3.11 —
  it is the lowest-frequency screen there is), the tab bar back to five, the live-state
  badge floated into the tab's corner instead of competing with the label, and the type
  stepped down below 380px.
- **Why it mattered:** the labels ran together — "REVEALORACLELOGRULESSETTING" — and the
  last was cut off the screen. **The smoke harness could not see it:** the overflow check
  deliberately skips `position: fixed` elements to avoid false positives, so the fixed bar
  could crush unnoticed. A new check (`fixedBarFit`) measures the bar's own contents at
  320px and now runs on every route. Found by looking at a screenshot, which is the pass
  the probes cannot replace.

### F25 · The new Settings gear did nothing on the Settings screen
- **Fix:** `aria-current` on the corner control, same treatment as the brand link (F18),
  via one `markCurrent` helper rather than a second copy of the logic.
- **Why it mattered:** the interaction audit caught it on the first run after the change —
  which is the cadence working.

### F26 · `oracle.procedureCard` was written and never mounted
- **Fix:** mounted on the Ask screen.
- **Why it mattered:** §0 again, inside an hour of writing it. The dead-data scan caught it
  before the screen shipped, along with two unused lookups (`askAnswers`, `isDouble`) that
  were deleted or unexported.

### F27 · The citation check assumed a single source
- **Fix:** it accepts `MM69:p<n>` or `OPM`, and the library-size floor moved to 20 entries.

## Verified clean (cycle 2)

- **The chart.** All nine odds rows cover 1–100 exactly once; the published Yes bands
  (90/85/75/65/50/35/25/15/10) are asserted and are monotonic; the 50/50 boundaries at
  10/11, 50/51 and 90/91 are pinned; an out-of-range roll throws rather than answering.
- **Doubles.** All nine fire an event; 100 and near-misses do not; 400 asks produce both
  outcomes and the log shows one die normally and two on a double.
- **Discover Meaning.** 50 rows, both columns complete and unique across 1–100, with the
  row boundaries (1–2 Attain, 99–100 Warm) and the two words that appear in both columns
  at different rolls (Mundane, Strange) checked.
- **The pivot seam.** 200 asked pivot questions: every Yes opened the gate and every No
  closed it — the two modules agree about one piece of state.
- **Gating.** With the oracle off the tab disappears and both routes explain themselves in
  place and offer to turn it on, rather than redirecting.
- **Layout.** 403 smoke checks across twelve routes and three seed states; the tab bar now
  measured at 320px on every one.
- **Interaction.** 286 controls clicked in isolation, nothing inert.

## Cycle 3 — after adding The Villain Crafter

### F28 · Double Archetypes was implemented as recursive expansion, and diverged
- **Rule:** "Roll two Archetypes and combine them … if you roll Double Archetypes again,
  ignore it and re-roll" (MM41:p7)
- **Target:** `crafter.rollArchetype` / `rollOrganization` / `rollUnderling`
- **Fix:** one `expand()` that draws with a `banned` set — a nested Double is re-rolled at
  the draw, never expanded — plus Upscale banning Upscale and Double on its follow-up, and
  Teamwork reading As Expected the second time.
- **Why it mattered:** the first implementation added two pending rolls for every Double it
  saw. At the organization table with a +40 modifier, Double is 60% of rolls, so the
  branching factor exceeded one and the cascade ran to its guard every time. **This is the
  Cascade shape §3.0 warns about, failing in the other direction:** not "implemented once
  and the repetition lost", but implemented without the termination the rule states. Caught
  by a test that asserts every cascade finishes, run at a deliberately hostile modifier.

### F29 · The villain screen was 8.7 viewports with a full roster
- **Fix:** the newest lieutenant and minion stay open, earlier ones collapse to a line
  carrying their name and archetype, and each roster pages at four.
- **Why it mattered:** the same D-9 as the dossier (F19), on a screen written after that fix
  — which is the argument for the probe being a standing pass rather than a one-off. After:
  4.0 viewports, 32 controls.

### F30 · The seeds did not cover the new state
- **Fix:** `make-fixtures.mjs` now crafts a villain (and asks the oracle) in both seeds —
  one lieutenant and one minion mid-session, four and six under stress.
- **Why it mattered:** the interaction audit had been clicking an empty three-step builder
  and reporting it clean. Changing the seed is the method note cycle 2 left for cycle 3.

### F31 · The citation check and the library floor were one source behind again
- **Fix:** both accept `MM41:p<n>` and the floor moved to 28 entries. Third time this check
  has needed widening; it is cheap and it has caught a miscited entry each time.

## Verified clean (cycle 3)

- **Tables.** Archetype: 23 rows, every roll 1–100 hits exactly one, keys unique.
  Organization and underlings: every total from −50 to 200 returns exactly one row, so no
  modifier can fall off either table.
- **The article's own arithmetic.** Its worked example reproduces end to end: +10 to the
  organization, 42+10 → The Company, +15/+20 to underlings, 28+15 → Tough Stuff,
  7+20 → Groveler; and the spore example's 25+10 → Organized Crime.
- **Cascades.** 300 organization rolls at +40 never produce more than two archetypes and
  never leave a Double in the result; Upscale keeps both sets of modifiers; Teamwork brings
  exactly one partner; every cascade finishes well inside its guard.
- **The source gap.** The three unreadable bands carry the flag and nothing else — no
  invented text — and a minion roll landing there reports the gap with the Lieutenant entry
  as context.
- **State.** A crafted villain survives a reload; an old adventure back-fills an empty
  roster; underlings rename and delete.
- **Layout and interaction.** 436 smoke checks over thirteen routes and three seeds; 331
  controls clicked in isolation, including the crafted state.

## Cycle 3b — the source gap closed

### F32 · The Minion column's three unreadable bands
- **Rule:** MM41:p14-15
- **Fix:** the user supplied photographs of both pages. The page merges cells vertically:
  **Soldier is one cell spanning 40-44** and **On A Mission spans 68-76**, which is exactly
  the information a flattened transcription destroys. All three bands filled from the page;
  the `unrecovered` flag, the engine branch that carried it, the gap block in the UI and the
  toast that mentioned it were all removed **in the same change** — a caveat kept after its
  cause is gone is §0 wearing a third coat.
- **Why it mattered:** it is the §2.1 process working end to end. The table was flagged, not
  reconstructed; the app told the truth to the player while it was incomplete; and one
  request for a photo resolved it. Two tests replaced the gap tests: every total from -20 to
  120 resolves to a named minion archetype, and the merged-cell spans are pinned so a future
  edit cannot quietly reintroduce a hole.

### F33 · The Crafter's modifier columns were paired by order, not read
- **Rule:** MM41:p6-7 and p10-11
- **Status:** **verified, no corrections.** The transcript de-interleaved the modifier
  column from its rows, so 22 archetype triples and 18 organization pairs had been matched
  by position, with only three rows (Has No Choice, One Of The People, The Domination Game)
  confirmable from the article's own worked examples. Page photographs confirmed all 41.
- **Fix:** an independent transcription of both tables now lives in the unit harness and is
  asserted row by row, along with fifteen band boundaries.
- **Why it mattered:** this was the largest remaining silent-error risk in the app. A wrong
  modifier does not crash, does not look wrong in play, and skews every downstream roll —
  the exact profile §11.3 describes as where findings hide. It is also the §2.1 rule paying
  off twice: the Minion cells were flagged and asked about, and this column, which *looked*
  recovered, was still worth asking about.

## Cycle 3c — after adding the Elements tables

### F34 · The interaction audit produced a false finding
- **Target:** `tests/interaction.mjs`
- **Fix:** the snapshot now hashes `#screen`'s content and records every `aria-pressed` /
  `aria-current` state, instead of signing the screen by innerHTML **length** plus its
  first 400 characters of text.
- **Why it mattered:** toggling one chip on and another off preserves both. It flagged
  exactly one of fourteen table chips as "changes nothing" — a finding that reproduced
  nowhere and would have sent the next reader hunting a bug in working code. A harness
  that lies once gets ignored twice (§13 D-15 in its other direction: not a manufactured
  race, a manufactured blind spot).

### F35 · The details step was numbered 4 and placed third
- **Fix:** MM41:p4-5 runs villain → details → organization → underlings; the card moved to
  match and the four steps renumbered.
- **Why it mattered:** §6.3.3 — a screen that hosts a procedure presents its controls in
  the order the book performs them. Caught by looking at a screenshot, again.

## Verified clean (cycle 3c)

- **The twelve tables.** 100 unique non-empty words each; thirteen anchors transcribed
  independently from the photographs and asserted; every roll 1–100 resolves on all
  fourteen tables in the registry (twelve Elements at span 1, two One-Page Mythic columns
  at span 2); an unknown table id and an out-of-range roll both throw.
- **The seven MM41 names.** Identity, Skills, Motivations, Personality, Appearance,
  Traits & Flaws, Background — all present, in that order, asserted.
- **Details state.** They attach to the villain and to one named underling, survive a
  reload, back-fill empty on old records, and a removal touches only its own holder.

## Cycle 4 — after adding scenes, chaos and the lists

### F36 · `Number(x) || default` swallowed a legitimate zero
- **Rule:** the Chaos Factor floors at 1 (GME2e, via summary)
- **Target:** `rules.clampChaos`, `derived.normalizeAdventure`
- **Fix:** `Number.isFinite` instead of `||`.
- **Why it mattered:** "in control at chaos 1" produces `clampChaos(0)`, and 0 is falsy, so
  it returned the **start value of 5** rather than the floor of 1 — a four-point jump in
  the number that governs every scene, silently, at exactly the moment a calm adventure
  should be calmest. The test that caught it checks the boundary rather than the middle;
  a test at chaos 5 would have passed forever. The same idiom was fixed on list entries.

### F37 · Disabled list controls explained themselves in a `title`
- **Target:** `scenes.listRow`, the add-to-list button
- **Fix:** the controls stay enabled and refuse out loud, naming the rule ("already holds
  three lines, which is the most any element may have").
- **Why it mattered:** §13 D-26 — a gate living in a tooltip, on a phone, where there is no
  hover. The interaction audit's "a disabled control must explain itself on screen" rule
  found all five in one pass.

### F38 · The header grew to five cells and clipped
- **Fix:** open leads left the header; it was already the Dossier tab's badge, so the
  number was in two places. A new `headerFit` check measures the header at 360px on every
  route, the way `fixedBarFit` measures the tab bar.
- **Why it mattered:** the header scrolls, so nothing overflowed the document and the
  existing checks stayed green — the same blind spot as F24, in the other fixed bar. Two
  bars, two measurements; that is the whole lesson.

## Verified clean (cycle 4)

- **The scene test.** All 90 roll-by-chaos combinations asserted against the rule, plus the
  boundaries: 6 clears a chaos of 5, 5 alters, 4 interrupts, chaos 9 is cleared only by a
  10, chaos 1 is failed only by a 1.
- **Chaos.** Clamps at both ends, starts at 5, moves one step per scene, reports "already at
  its floor/ceiling" rather than pretending to move, and **never reaches the ask odds**.
- **Bookkeeping.** Refuses with no scene running and with an unstated control; snapshots, so
  the whole boundary undoes in one step.
- **Lists.** The three-line cap holds through normalization whatever the store is told;
  twenty-five lines counted by weighting; crossing out frees every line; the clean-up
  carries live elements and reduces threes to twos; the house-aid pick is labelled and its
  weighting measured at ~3× over 2,000 draws.
- **Provenance.** The subsystem is marked summary-sourced and provisional, the five
  unsupplied pieces are listed in the app, and the adjustment options are flagged
  `rollable: false`.

## Cycle 5 — after the Fate Chart and the Action tables

### F39 · `rules.housePick` outlived the file it read from
- **Target:** `src/rules.js`
- **Fix:** deleted with the house aid it exposed.
- **Why it mattered:** deleting `data-house.js` left an exported arrow function closing over
  an identifier that no longer existed. It parses; it would have thrown a `ReferenceError`
  the first time anything called it. The dead-data scan caught it in the same pass as the
  deletion — which is the argument for running the scan on *every* change that removes
  data, not only on ones that add it.

### F40 · The Event Focus reasons were extracted and never shown
- **Fix:** a fold on the Ask screen listing every focus with its range, the list it points
  at, and the book's own note on when you would pick it rather than roll it.
- **Why it mattered:** §0, for the fourth time in this project and the first in three
  cycles. The table was in the data, the engine read its labels, and a whole column of the
  page — the reasons — reached nothing. The scan flagged `eventFocusTable` as exported and
  unimported, which is what pointed at it.

## Verified clean (cycle 5) — the chart, two independent ways

The Fate Chart is 81 cells of three numbers each, transcribed by eye. Two checks make that
defensible:

1. **Structural.** The chart is one thirteen-rung ladder read at an offset set by the odds
   row and the Chaos Factor. Every one of the 81 cells is asserted against the ladder
   prediction. A single mistyped digit anywhere fails it.
2. **Cross-source.** The chaos-5 column is identical to the One-Page Mythic chart in
   `data-mythic.js`, transcribed days earlier from a different page by a different route.
   All nine rows, all four bands, all 36 boundaries. Two independent transcriptions of the
   same underlying table agreeing exactly is the strongest evidence available short of the
   publisher's own file.

Also clean: every roll 1–100 resolves on every one of the 81 cells; the impossible cells
behave (Certain at chaos 7 has no Exceptional No, Very Unlikely at chaos 1 has no
Exceptional Yes); a non-d100 value throws; the Event Focus table covers 1–100 and names
which list each focus points at; the Scene Adjustment table covers 1–10 and its 7–10
cascade terminates over 300 runs; both Action tables are 100 unique words with their page
anchors; the list roll reads section then line and reports Choose on a blank.

## Not yet run

- **Cycle 6.** Cycle 5 found two, both from the dead-data scan, both from *removing* and
  *adding* data in the same change. The stopping rule is still not met. Next: a full
  rules read-through of `docs/rules/*.md` against the engine now that six sources are in —
  the last one was three sources ago.
- **Cycle 5 (historical).** Cycle 4 found three, one of them a real arithmetic bug in the newest
  subsystem and two of them repeats of earlier findings in new places (a gate in a tooltip,
  a fixed bar that clips). The habit to build next: when a screen gains a control that can
  refuse, write the refusal before the disable; when a fixed bar gains a cell, measure it.
- **Cycle 4 (historical).** Cycle 3 found four more, so the stopping rule is still not met — and two of
  them (a density defect on a new screen, a seed that did not cover new state) were repeats
  of cycle 1 and 2 findings in a new place, which says the passes work and the *habits*
  have not caught up. Next cycle: walk the module seams (crafter ↔ oracle ↔ store, where
  one module's rolls are written by another), and re-read `docs/rules/*.md` against the
  engine now that three sources are in.
- **PWA update path.** The service worker's network-first navigation and the update toast
  are written but not yet exercised by deploying a change and reloading — the one PWA
  behaviour that cannot be verified by looking at the running app.

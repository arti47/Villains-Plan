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

## Cycle 5b — the summary's values confirmed by quotation

### F41 · The clean-up transfer kept two-entry elements at two
- **Rule (quoted):** "copy over the Threads and Characters you want to keep, **with a single
  entry for each element**. For any Threads or Characters with three entries on the
  original List, give them two entries on the new List." (GME2e)
- **Target:** `store.cleanupList`, `LISTS.cleanupEntries`
- **Fix:** the mapping is now explicit data — `{1: 1, 2: 1, 3: 2}` — instead of a
  `Math.min(entries, 2)` that quietly left twos alone.
- **Why it mattered:** a real rules error, shipped, from a summary that said "elements that
  maxed out at three entries are reduced to two" and did not mention what happens to the
  rest. The wrong version freed less room and left the list weighted more heavily than the
  book intends. It is the §2.1 rule paying off a third time: **a summary corroborates, it
  never decides** — and the thing it got wrong was not a number it stated, but one it
  omitted. The test now pins all three cases and asserts a full list always frees room.

### The rest of the summary, confirmed
Direct quotations confirmed the scene test (including why the book's even list stops at 8 —
a 10 can never be within a Chaos Factor capped at 9), the Chaos Factor's start, step and
clamps, the five-sections-of-five structure, the three-entry cap, and both bookkeeping
steps. Those values dropped their `provisional` flags; `LIST_SELECTION` is the only
summary-only rule left and keeps its flag and its recorded inference (A28).

## Cycle 6 — the last three subsystems

### F42 · `CHAOS.fixedForMechanics` was data with no engine
- **Rule (quoted):** "Treat the Chaos Factor as a value of 5 for these Questions, regardless
  of what the actual Chaos Factor value is right now."
- **Fix:** `rules.chartChaos(chaos, { forMechanic })` and a checkbox on the Ask screen.
- **Why it mattered:** §0 again, and this one hid from the dead-data scan because it is an
  **object field**, not an export — the scan reads exports and imports, and a constant
  buried in a data object is invisible to it. It sat there from the day the scene rules
  went in. The check that would have caught it is the rules read-through, which had not
  run since three sources ago. That is the argument for the cadence, not the scan.

### F43 · A half-applied edit lost the Random Chaos log row
- **Target:** `scenes.endScene`
- **Fix:** re-applied the block; the scene's `control` is now stored as `"random"` and the
  d10 lands in the roll log.
- **Why it mattered:** a two-part edit where only the first part matched. Everything still
  ran — the chaos moved correctly, the summary read correctly — and the only visible
  symptom was a missing log row, which a test asserted and reading would not have caught.
  Every roll this app makes is supposed to be in the log; silence there is a defect.

## Verified clean (cycle 6)

- **Chaos modes.** A mechanic question reads 5 at any chaos; No-Chaos reads 5 for questions
  while the scene test still uses the real value; Random Chaos rolls, moves one step, stays
  inside 1–9, and logs its die. Standard mode still refuses to close a scene without an
  answer about control.
- **The progress track.** Two points per award, points never pass the track length, plot
  armour holds until full and lifts exactly at full, it covers only the focus thread, the
  track dies when its thread is crossed out, and it survives a reload.
- **The Conclusion.** Focus is `current-context`, marked automatic, no focus die, two Action
  words.
- **What is still unsupplied** is listed and *explained*: the Fate Check (exists, procedure
  not supplied), Mid-Chaos (modifiers written for the Check, not the Chart), the Discovery
  Check (named, procedure not supplied).

## Cycle 7 — the Fate Check

### F44 · A missing import that only fired on one path
- **Target:** `oracle.checkCard` used `inlineRow` without importing it.
- **Fix:** imported.
- **Why it mattered:** the parse gate passes, the unit harness passes (it never touches the
  DOM), and the screen renders fine — until you click the one chip that switches the
  resolution to the Fate Check, at which point the page throws. **The interaction audit
  caught it on the first run**, which is exactly the case it exists for: a control that is
  fine until someone presses it.

## Verified clean (cycle 7)

- **The Fate Check.** Both quoted modifier ladders asserted cell for cell; the answer
  thresholds checked at every boundary (11 is a Yes, 10 is not; 18 is Exceptional, 17 is
  not; 4 is Exceptional No, 5 is not) and past both printed ends (a total of 30 and a total
  of −8 both land correctly); a d10 out of range throws.
- **Its random event.** Doubles fire at or under the Chaos Factor, a double 10 never fires
  because chaos stops at 9, and a non-double never does.
- **Mid-Chaos.** Its ladder is the standard ladder at chaos 3–7 — asserted, because that
  equivalence is what tells you Mid-Chaos compresses the range rather than changing the
  maths. Selectable on the Check, refused on the chart with the reason, and dropped by
  normalization if the resolution changes under it.
- **The Discovery Check.** Every total from −5 to 60 finds a row; the four results with no
  stated effect award nothing and say so; the four that do award exactly the quoted 2/2/3/3.

### F45 · A gap list four sources out of date, printed to the reader
- **Target:** `STILL_NOT_IN_SOURCE` in `data-mythic.js`, rendered first on the Rules screen's
  "What this app does not do" card.
- **Symptom:** it still named the Fate Chart, the Event Focus table, the Scene Adjustment
  Table's ranges, the Thread Progress Track and the chaos variants as missing. All five
  have been supplied and built — two of them are the engine the oracle reads.
- **Why it survived:** the test that guards this (`what is still unsupplied is recorded`)
  read `notSupplied()` only. The app has **two** gap lists and the test knew about one, so
  the other drifted with every source while the suite stayed green.
- **Fix:** the list is now empty and says in its own comment why it is empty and where to
  add instead; the card renders a positive line when it is empty rather than an empty `ul`;
  the test reads **both** lists and asserts the list is empty. Verified by re-adding a
  stale entry — the suite fails.
- **The class:** this is the §0 defect inverted. Not data extracted and never called, but
  data called and never re-examined — stale prose asserting a falsehood about the app,
  surfaced in the UI, with a test nearby that looked like it covered it.

## Cycle 8 — the variant charts

### F46 · A test that was 5% wrong about its own log row
- **Target:** `the ask engine uses whichever resolution the adventure is set to` asserted
  the ask's log row held exactly two dice.
- **Symptom:** it failed about one run in twenty.
- **Cause:** when a Fate Check rolls doubles at or under the Chaos Factor it fires a random
  event, and `oracle.ask` appends that event's focus and two Action words to **the same**
  log row — so the row holds five dice, correctly. The test asserted the common case.
- **Fix:** assert what is invariant (the two d10s are there, with the values that were
  rolled) and make the total conditional on `double`. Confirmed over 30 consecutive runs.
- **Worth noting:** the first fix was wrong. It assumed the extra row was a *separate* log
  entry and searched by question text, which changed nothing — the flake reappeared at the
  same rate. A flake is not fixed until you have seen it not happen many more times than
  its rate; running the suite once and seeing green proves nothing at 5%.

## Verified clean (cycle 8)

- **All three variant Fate Charts.** 81 transcribed cells, every one asserted against the
  standard chart's corresponding column, plus a column-coverage check (exactly one column
  holds each Chaos Factor 1–9, no gap, no overlap). Together with the standard chart's own
  ladder check, the four charts now cross-validate each other.
- **The compression is real, not assumed.** Mid-Chaos reads the standard chart at 3–7 and
  Low-Chaos at 4–6, asserted at both ends; No-Chaos reads the same band at chaos 1, 5 and 9.
- **Low-Chaos on the Fate Check.** Both directions: the quoted modifiers cell for cell, and
  the equivalence to the standard ladder at chaos 6/5/4.
- **The Discovery Fate Question.** All four answers: how many rolls each buys, and that
  only the Exceptional No closes the scene. The shutdown persists across a save and
  reload (it gates a control), and the next scene opens Discovery again.
- **Mode persistence.** Every chaos mode now survives a switch of resolution, where
  Mid-Chaos used to be forced back to standard.

## Cycle 9 — the Progress Track chapter

No defects. The chapter closed the app's last gap and added four rules, all built and
tested; what follows is what the passes confirmed.

## Verified clean (cycle 9)

- **All eight Discovery results award points**, 2/2/1/3/3/2/1/2 reading down, each with
  the kind the book names. The kind is not decoration: only a flashpoint satisfies a phase,
  so a Track or Strengthen result scoring 2 points must *not* count as one.
- **Phases of five.** Asserted on a 10-point track: two phases, the boundaries right, a
  phase that completes without a flashpoint is owed one, and a flashpoint anywhere inside
  the phase satisfies it. The second case is the book's own worked example — 6 points with
  a flashpoint already had, and no trigger — which is why it is a test rather than a note.
- **The delayed conclusion's scene is not tested.** At chaos 9, where a tested scene almost
  never holds, the conclusion's scene comes back `untested`, with no die and an `expected`
  outcome; the scene after it is tested normally, so the guarantee is spent once.
- **Plot armour against Close A Thread.** The event still plays out; the block says the
  thread does not actually close while the track is unfinished.
- **`NOT_SUPPLIED` is empty, and the suite asserts it is empty.** That assertion is the
  F45 lesson applied in the other direction: the list was wrong for four sources because
  nothing checked it. It is checked now, in both directions.

## Cycle 10 — reported from play

### F47 · Every control threw the reader back to the top of the page
- **Reported by the user:** rolling for an underling, or picking a details table, jumped
  the page to the top.
- **Cause:** `refresh()` was `render()`, and `render()` ends with
  `screen.scrollTop = 0; window.scrollTo(0, 0)`. That reset is right for a **navigation**
  — you arrive at a screen at its top — and wrong for the in-place redraw that every
  control in the app performs. All 70 call sites inherited it.
- **Fix:** `refresh()` now renders with `inPlace: true`, which captures `window.scrollY`
  **before** the screen is emptied (clearing it collapses the page height and the browser
  clamps the scroll immediately, so reading it afterwards returns the wrong number) and
  restores it after mounting. A real navigation still goes to the top, and `afterMount`
  runs last so a citation link's `scrollIntoView` still wins.
- **Why no harness saw it:** all three harnesses assert on *content*. None of them had
  any notion of where the reader was standing, so a defect that made the app unpleasant
  to use in exactly the way a play session would notice was invisible to 1,100 passing
  assertions. The lesson is not "add a scroll test" but that **position is state**, and
  the harnesses only knew about DOM state.
- **Now covered:** the interaction audit parks each control mid-viewport before clicking
  it and fails if the page ends up back at the top on the same route. Verified by
  reverting the fix: **63 controls fail**, across every route.
  - The check had to centre the control first. Playwright scrolls a target into view
    before clicking, so parking at a fixed offset and clicking something near the top of
    the page measures the harness scrolling up, not the app. The first version of this
    check reported 30 failures that were all its own doing.
  - Clicking the tab or pill you are already on is exempt: that is a navigation to the
    current screen, where going to the top is the familiar behaviour.

### F48 · The update notice vanished in 3.2 seconds
- **Reported by the user:** a feature that had just shipped still behaved the old way.
- **Cause:** not the feature. The app caches itself for offline use, and the one signal
  that new code is waiting was an ordinary toast — auto-dismissed after 3.2 seconds and
  removed at 3.8. Miss it and you keep running the old build with no way to tell, and the
  app looks as though the fix never landed.
- **Fix:** three parts, because one was not enough.
  1. `showToast` gained `sticky`; the update notice never times out and is an `alert`.
  2. `reg.update()` on every return to the page. An installed app can stay open for days,
     so a check only at first load is a check that mostly never happens.
  3. **The running build is on the Settings screen**, with a "check for a new version"
     control and a plain sentence about what to do if a reload does not change it.
- **And a check so the number cannot lie:** `APP.build` must equal the service worker's
  `CACHE_VERSION`, asserted by the unit harness. A version on screen that drifts from the
  cache it names is worse than no version at all.
- **The class:** every harness runs against a *fresh* page, so the cached-old-code state
  is one no harness can enter by construction. What made it findable was the user
  reporting behaviour I had verified working — the second time that happened, which is
  what pointed at delivery rather than at the code.

### F49 · A test that was wrong about the rule, one run in ten
- **Target:** `Teamwork rolls a partner archetype` asserted exactly **one** Teamwork per
  underling result.
- **Cause:** that is not the rule. The underling table's **83 or more is Double
  Archetypes**, which draws two independent entries and — unlike Upscale — leaves no
  trace of itself in `parts`. Either of those draws may legitimately be Teamwork (59–60).
  What the book forbids is narrower: a Teamwork drawn as a Teamwork's *partner*, which
  "reads as As Expected". The engine had it right; the test did not.
- **Fix:** assert the actual invariant — a Teamwork is always followed by its partner, and
  that partner is never itself a Teamwork — over 2000 rolls.
- **And a trap avoided:** the first rewrite also asserted that two Teamworks *do* occur,
  to prove the point. That needs a Double and then 59–60 twice, about one roll in
  fourteen thousand, and it failed eight runs in twelve — the same mistake in a new coat.
  The table's shape is a fact, so it is asserted as a fact (83+ is Double, 59–60 is
  Teamwork) rather than waited for. **Never assert on a rare roll; assert on the thing
  that makes it possible.**

## Cycle 10 — the truthfulness pass, and the rules read-through

### F50 · The reference docs had drifted in nine places
- **Symptom:** `docs/rules/scenes.md` said, in one paragraph, that four Discovery results
  "are printed with no stated effect, so the app applies nothing", and forty lines later
  that all eight award points. `arcs-and-pivot.md` said the app does not roll the pivot
  Fate Question (it has since A14). `elements.md` said four subsystems "remain in
  `STILL_NOT_IN_SOURCE`". `villain-crafter.md` routed meaning results to One-Page Mythic
  (A17 revised that). `scenes.md`'s provenance paragraph said everything ships
  `provisional: true` and nothing does. `CLAUDE.md` §1.2 named two closed gaps; its
  sources list ran 1, 2, 3, 5, 6, 4. Nine places.
- **Cause:** every one was updated by *insertion* — a new paragraph beside the old — and
  never by re-reading the file. The audit reads these docs against the engine, so a doc
  that lies makes the read-through worthless.
- **Fix:** all nine corrected, and the guard from F45 extended to prose: the harness now
  derives a canonical "unsupplied" line from the data and asserts `CLAUDE.md` carries it,
  and refuses any "still not supplied" passage in the spec or the docs that names a
  subsystem that ships.

### F51 · The list roll's result was a toast
- **Target:** rolling on a Threads or Characters list.
- **Symptom:** the result appeared for 3.2 seconds and was gone; on a blank line it said
  "Choose" and nothing more. `LIST_SELECTION.chooseText` — the book's two options, take
  what fits or roll again until you land on an element — was never read.
- **Fix:** the result stays on the list card with its dice; a blank line shows the two
  options from the data and offers **Roll again**.

### F52 · The Fate Check's random-event rule was inlined prose
- `FATE_CHECK.randomEvent.text` and its `note` (a double 10 can never fire one, because
  chaos stops at 9) were in the data and never read; the check card carried its own
  sentence. Now read from the data, with the note. The card also names the Mid-/Low-Chaos
  band the modifier came from, so `midChaosBands`/`lowChaosBands` are read too.

### F53 · The phase rule's two subtleties never reached a surface
- `phaseFlashpoint.timing` (mid-scene fires now, bookkeeping waits for the next scene) and
  `.both` (a moment can be both, and calling it a flashpoint satisfies the phase) were
  extracted and unread; the pending banner had its own inline copy. Both now shown.

### F54 · The unit harness counted an async test as a pass
- **Cause:** `test(name, fn)` called `fn()` inside a `try` and incremented `pass`. An
  async `fn` returns a promise; the rejection lands later, nowhere. Two tests written in
  this cycle were green while one of them should have failed.
- **Fix:** `test()` refuses a thenable with a message saying why; unit tests are
  synchronous by contract and hoist their imports. No earlier test was async, so no
  earlier green was false — but the trap had been open since the harness was written.
- **Also removed:** five fields nothing read and nothing should — `chaosRange`,
  `addProgress`, `plotArmorClosesThread`, `alternativeTo` — dead metadata the field scan
  would otherwise carry forever.

## Verified clean (cycle 10)

The docs' engine claims that could have been inert, each confirmed in code: the re-roll
keywords control confirms and logs; Discovery cannot be left before the End Goal; the
pivot override is cleared by use and by reload; bookkeeping snapshots for undo; a No
prints the Discover Meaning route; the Event Focus reasons show in their fold; the text
dossier export exists. And the mechanical read-through is now a permanent harness test:
**every field of every data export must be read by `src/`**, with lookup keys and the
three harness-only cross-checks allowed by name.

## Cycle 11 — accessibility and data safety

### F55 · Keyboard focus fell to `<body>` on every press
- **Target:** every control. `refresh()` rebuilds the screen, and the element that had
  focus no longer exists, so focus went to `<body>` — the top of the tab order. For a
  keyboard or screen-reader user this was worse than F47: press a chip, lose your place
  entirely.
- **Fix:** on an in-place redraw the router records the focused control's tag, label and
  position among controls with that label, and after mounting focuses the match (label
  and position; then first of that label; then the same position of that tag, for a press
  that changed its own label). `preventScroll`, because scroll is restored separately.
- **The first version missed a third of it.** It was scoped to `#screen`, and the audit
  caught one press it did not cover: the action bar's "Roll a lieutenant", which lives in
  `#action-slot`. Controls live in three slots — the screen, the pinned action bar, the
  resource header — and all three are rebuilt, so the slot is now part of the identity
  and the action bar's copy restores to the action bar's copy, not the card's.
- **Now covered:** the interaction audit fails any same-route press after which a control
  with the same tag and label still exists, in any of the three slots, and does not have
  focus. A modal taking focus, or a control that removed itself, are the two legitimate
  exceptions and are exempt. Verified by disabling the restore: **65 presses fail**.

## Verified clean (cycle 11)

- **The backup ring.** Newest first, capped at five, each restorable; the restore itself
  snapshots so it is one step from undone; a backup exports in the export's own file shape
  and `importJSON` accepts it. Fires before an arc boundary, before an import and before a
  delete — and the delete's backup still holds the adventure. Settings shows the card,
  takes one by hand, and offers restore, save and delete on every row.

## Not yet run

- **Cycle 8.** The rules read-through is now overdue by six sources and is the next
  cycle's first job — F42 showed what it finds that the scans cannot.
- **Cycle 7 (historical).** Cycle 6 found two, one of them an inert rule that had been sitting in the
  data for two cycles because the scan cannot see object fields. The read-through is the
  pass that finds those, and it is now overdue by four sources — that is the next cycle's
  first job, not its last.
- **Cycle 6 (historical).** Cycle 5 found two, and 5b found a real rules error the quotes exposed.
  Cycle 5 found two, both from the dead-data scan, both from *removing* and
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

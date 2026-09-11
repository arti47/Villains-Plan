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

## Not yet run

- **Cycle 3.** Cycle 2 found four things, so the stopping rule is not met. The method that
  paid this time was looking at rendered screenshots at 320px — the probes reported "no
  overflow" for a bar that was visibly broken. Next cycle: read the modules by seam
  (oracle ↔ sheet, store ↔ derived), and seed a state where the oracle has been used
  heavily.
- **PWA update path.** The service worker's network-first navigation and the update toast
  are written but not yet exercised by deploying a change and reloading — the one PWA
  behaviour that cannot be verified by looking at the running app.

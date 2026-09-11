# Schemer — project spec (canonical)

Instantiated from *RPG Player-Character App — Autonomous Build Instructions v3*.
This file is canonical. **Every code change updates it in the same change** (§10.1).

Source of record: `docs/villains-plan.md` — the extracted text of "The Villain's Plan",
*Mythic Magazine* Vol. 69, pp. 16–28. Cited in data files as `MM69:p<page>`.

---

## 1. What this is

| | |
|---|---|
| **Game** | "The Villain's Plan" — a Mythic GME subsystem for revealing a villain's scheme in stages. **Not a full RPG.** |
| **Scope decision** | Build the Villain's Plan tool only (user decision, Stage B). Mythic core (Fate Questions, Chaos Factor, scene setup, Discover Meaning, Random Events) is **not in the supplied source** and is therefore **not implemented and not invented** (§2 hard rule). |
| **Audience** | A solo player/GM emulating a GM (Stage B: seat = solo). No GM screen. |
| **Platforms** | Phone-first installable PWA; browser and desktop follow. |
| **Core job** | Adventure/villain dossier · earned-Discovery reveal engine · End Goal Roll state machine · Pivot Plan coda · roll log · rules library · tutorial. |
| **Backend** | None built. `firebase-config.js` + `database.rules.json` ship as the Phase 5 schema only (Stage B: local-first, sync later). |
| **Theme** | Dossier ink: aged paper light / near-black dark; crimson = villain & threat, gold = revealed knowledge. System default, in-app override. |

### 1.1 Product Decisions (Stage B Q&A)

| # | Question | Answer | Consequence |
|---|---|---|---|
| 1 | Usage mode | Local-first, sync later | Phase 5 gated; campaign-shaped schema + RTDB rules ship now, no sync code. |
| 2 | Seat | Solo player/GM | **No `gm.js`, no GM screen, no device hand-off pass.** |
| 3 | Dice input | Digital only | No manual-entry UI. Roller is the only source of dice. |
| 4 | Expansions | n/a — single source | No `data-<expansion>.js`, no content toggles for books. |
| 5 | Table device | Phone-first (default) | Harness widths 320/360/390. |
| 6 | Theme default | Follow system | `prefers-color-scheme` + persisted override. |
| 7 | One campaign or many | **Many, with a list** | `adventures/{id}` from day one; archive keeps finished adventures as records (§14.1.1 taken). |

### 1.2 Scope exclusions — recorded, not forgotten

Omitted because the source has no such mechanics (never invented):
character sheet · attributes/skills/derived stats · health/damage/death · rest · combat &
initiative · inventory/encumbrance/wealth · powers · advancement · conditions · bestiary ·
NPCs · pregens · official solo tables · GM tables · safety tools.
Therefore absent by design: `data-monsters.js`, `data-npcs.js`, `data-pregens.js`,
`data-solo.js`, `power-automation.js`, `solo.js`, `gm.js`, `combat.js`, `wizard.js`'s
character path (it builds an adventure dossier instead).

House aids (§2.2): **none.** No invented tables ship.

---

## 3. System Profile (completed, Stage A)

Extraction is complete: the source is 11 pages and every table, formula and procedure in
it is in `data.js`. See `docs/villains-plan.md` for the full extraction.

**3.1 Core resolution.** The subsystem has no task resolution of its own. Its dice are:
`d100` on three Focus tables, `d100` ×2 on Plot Twists (keywords), and `d10` for the End
Goal Roll. No crit/fumble, no push economy, no advantage mechanism, no cascades.
*Family (§15): narrative / Permission-dense — the risk is the app becoming a notepad.*

**3.2 Opposed tests.** None in source.

**3.3 Meta-currencies.** None. The only escalating quantity is the End Goal Roll modifier.

**3.3a Currency interactions / lose conditions.** One comparison, and it is the point of
the subsystem: `d10 + 2×phasesKnown ≥ 11` → the End Goal is revealed. It lives in the
persistent header (§3.0 Threshold rule).

**3.4–3.6 Attributes / derived stats / skills.** None in source. A near-empty slot is a
load-bearing finding: this app tracks a *plan*, not a character.

**3.7 Creation.** The app's creation flow is the **adventure dossier**: adventure name,
villain name/epithet, what the PC already knows, and the pivot-eligibility facts. Nothing
in the source constrains these — all free text, no legality rules to enforce.

**3.8 Shared group entity.** None.

**3.9 Conditions.** None. The only stateful flags are arc stage and pivot eligibility.

**3.10–3.11 Health / rest.** None in source.

**3.12 Lifecycle.** The source defines **arcs, not scenes**: Discovery → Foiling → optional
Pivot. Boundaries the app owns: *End Goal revealed* (Discovery → Foiling), *Plan defeated*
(Foiling → Pivot-eligible), *Pivot resolved* / *Adventure concluded*. Each fires a bundle,
reports what changed, and offers one-step undo. Scene-level boundaries belong to Mythic
core and are **not in source** — the app does not fake them.

**3.13 Extended tasks.** The Discovery arc *is* one: each earned Discovery contributes a
phase, and the escalating modifier is its progress track. One tracker component serves it.

**3.14 Powers.** None.

**3.15 Advancement.** None. The nearest thing is the phase count driving the modifier.

**3.16 Inventory.** None.

**3.17 Combat.** None.

**3.18 Bestiary / NPCs.** None statted. The villain is free text by design.

**3.19 Pregens.** None. The two worked examples (General Gorazon, Cold Rock Cold Heart) are
*illustrations*, shipped as read-only examples in the rules library, never instantiable
adventures (they are setting content of the article's own invention — paraphrased, §12).

**3.20 Solo rules.** The whole subsystem is a solo/GM-emulator aid, but it publishes no
oracle of its own beyond the four tables. No separate solo tab.

**3.21 GM tables.** The three Focus tables are the GM tables. No separate GM screen (seat = solo).

**3.22 Safety tools.** None in source. Recorded as absent.

### 3.0 Rule-shape census — what this app must be good at

| Shape | Count | Rules |
|---|---|---|
| Lookup | 4 | Villain Plan Focus, End Goal Focus, Pivot Plan Focus, Plot Twists |
| Threshold | 1 | `d10 + 2×phases ≥ 11` reveals the End Goal |
| Escalation | 1 | +2 per known phase |
| Once-per-X | 2 | End Goal once per adventure; Pivot once per adventure |
| Gate | 1 | Pivot requires survival / underlings at large / a failsafe |
| Exception | 2 | "No Context" branches (81–100 and 84–100) skip the Focus text |
| Permission | 3 | Earn a Discovery · interpret & revise freely · override a second Pivot |
| Guidance only | 4 | every phase opens a lead · End Goal must unify prior phases · Pivot arc ≤3 scenes · reveal the Pivot immediately |

Absent shapes: Modifier, Cost, Future cost, Compulsion, Substitution, Cascade, Conversion,
Blocker, Opposed. **There is no Future-cost rule in this source** — the one shape §15 says
every family forgets does not exist here, and that is recorded so no later pass hunts it.

### Ambiguity rulings (Stage B sign-off)

| id | Ambiguity | Ruling |
|---|---|---|
| A1 | Does the End Goal count as a phase? | No. It ends the Discovery arc. No further End Goal Rolls. |
| A2 | What feeds the +2? | Count of revealed non-final phases only. |
| A3 | Roll on the 1st Discovery? | Yes, rolled and logged; cannot fire (max 10 < 11). The UI states the target. |
| A4 | No Context | A real result, never a re-roll. Keywords alone. |
| A5 | Doubled keywords | Kept as amplification; never re-rolled. Guidance text only. |
| A6 | A second Pivot? | One per adventure; a second needs an explicit, logged override (Permission). |
| A7 | The "surprise" Pivot Fate Question | Not in source. The app never rolls it or invents odds; it records the answer the player resolves elsewhere, labelled not-in-source. |
| A8 | Earned Discovery | A control, never a roll, never prompted for. Optional "why" note. |
| A9 | End Goal coherence | The End Goal flow lists every prior phase for revision; phases stay editable. |
| A10 | Phase cap | None. The escalating modifier is the only pressure. |

**End Goal Roll thresholds** (the arithmetic the whole app turns on):

| Discovery | Phases known | Modifier | d10 needed | Chance |
|---|---|---|---|---|
| 1st | 0 | +0 | — | impossible (max 10) |
| 2nd | 1 | +2 | 9+ | 20% |
| 3rd | 2 | +4 | 7+ | 40% |
| 4th | 3 | +6 | 5+ | 60% |
| 5th | 4 | +8 | 3+ | 80% |
| 6th | 5 | +10 | any | certain |

---

## 5. Architecture — LOCKED

No build step; vanilla ES modules loaded directly. `crypto.getRandomValues` for every die
(§5.1) — `Math.random()` is banned and the unit harness greps for it. Individual dice are
always displayed. A roll happens once, is stored, and every render reads the stored value.
`localStorage` only; `firebase-config.js` is a placeholder with `FIREBASE_ENABLED = false`.
Storage is plain JSON, exported and re-imported in one tap, round-trip tested.

## 6. Files

| File | Purpose |
|---|---|
| `index.html` | Shell: app header, persistent header, screen mount, action bar, tab bar |
| `styles.css` | Dossier-ink theme (light+dark) + components |
| `data.js` | The four tables, the End Goal Roll constants, the procedure text (paraphrased, cited) |
| `data-library.js` | Rules-library entries + tutorial steps + the two worked examples |
| `firebase-config.js` | Placeholder + `FIREBASE_ENABLED` flag (Phase 5, not built) |
| `database.rules.json` | RTDB rules for the Phase 5 shape |
| `manifest.json`, `service-worker.js`, `icon.svg` | PWA |
| `tests/`, `package.json` | Harnesses A/B/C + probes + fixtures (dev only, not in the SW shell) |
| `docs/villains-plan.md` | The extraction (source of record) |
| `docs/rules/*.md` | Distilled per-subsystem reference the audit reads against the engine |
| `docs/AUDIT.md` | Numbered findings + verified-clean list |
| `README.md` | Setup + personal-use licensing note |

### 6.1 `src/` modules

| Module | Responsibility |
|---|---|
| `core.js` | Constants, `el`/`add` null-safe DOM helpers, crypto dice. No imports. |
| `ui.js` | modal/toast/confirm/prompt, `explain()`, `actionBar()` (+ its spacer), `citeLink()` |
| `rules.js` | Pure lookups over `data.js`: range lookup, keyword lookup, library lookup |
| `derived.js` | Phase counts, End Goal modifier/target/needed, arc stage, pivot legality, normalization/migration |
| `store.js` | Adventures CRUD, active adventure, phases, roll log, session record, export/import, undo stack |
| `roller.js` | The reveal engine: End Goal Roll, phase reveal, pivot reveal, roll-log writes |
| `sheet.js` | The in-play screens: persistent header, dossier (phase timeline, leads, editing), Reveal, Arc |
| `lifecycle.js` | Arc boundaries with confirmation summary + one-step undo |
| `wizard.js` | New-adventure dossier flow |
| `screens.js` | Adventures list (+ rename, export), roll log (+ distribution), rules library, settings, session record |
| `tutorial.js` | First-session walkthrough |
| `settings.js` | Theme, text scale, flags |
| `router.js` | Tab routing, section nav, live-state badges |
| `main.js` | Boot |

## 7. Data model

```
schemer.v1 = {
  version, activeAdventureId,
  adventures: [ {
    id, name, createdAt, updatedAt, archivedAt|null,
    villain: { name, epithet, known, forces, behind },   // behind: End Goal Focus 73-76
    arc: { stage: "discovery"|"foiling"|"pivot"|"concluded",
           endGoalAt|null, defeatedAt|null, pivotAt|null, concludedAt|null },
    phases: [ { id, ordinal, kind: "phase"|"endgoal"|"pivot",
                focus: { table, roll, key, label, text, noContext },
                keywords: [ { roll, word }, { roll, word } ], doubled,
                check: { d10, modifier, total, needed, fired }|null,
                earnedNote, interpretation, leads: [ { id, text, resolved } ],
                override|null, createdAt, revisedAt } ],
    pivotEligible: { survived, underlings, failsafe },
    pivotOverride,                       // one use, cleared by use and by normalization
    fateAnswer|null,                     // resolved outside the app; blocks the pivot on a No
    record: [ { ts, kind, text } ]
  } ],
  rollLog: [ { id, ts, adventureId, kind, dice: [ { die, value, table } ],
               summary, outcome } ],   // capped 200
  settings: { theme, textScale }
}
```
Every schema addition ships a normalization path that back-fills old records, and a fixture
test that loads a hand-written old-shape record (§10.17).

## 9. Roadmap

- [x] **Phase 0** — scaffold; complete data extraction (ledger below); theme; PWA; router; storage
- [x] **Phase 1** — new-adventure dossier wizard + adventures list
- [x] **Phase 2** — dossier tracker: phase timeline, leads, persistent header, export/import
- [x] **Phase 3** — reveal engine: End Goal Roll, three Focus tables, keyword pairs, roll log + distribution
- [x] **🏁 First Session Playable** — new adventure → earn a Discovery → reveal phases → End Goal → dossier reads as a plan
- [x] **Phase 4** — arc lifecycle with summaries + undo; Pivot gate and Pivot reveal; session record
- [ ] **Phase 5 — Multiplayer & sync.** *Gated and not built* (§1.1): the schema and RTDB rules ship so it needs no migration; there is no `sync.js`.
- [x] **Phase 6** — teaching layers: `explain()` everywhere, rules library with citations, tutorial
- [x] **Hardening** — harnesses A/B/C, probes, fixtures, audit to a clean cycle

### 9.1 Data Extraction Ledger

**How to continue:** work top to bottom; every value comes from `docs/villains-plan.md`
with a `MM69:p<page>` citation; tick the box in the same change as the data; an unticked
box means no UI may be built against it.

| # | Table | File | Consumer | Rows | Done |
|---|---|---|---|---|---|
| T1 | Villain Plan Focus (d100) | `data.js` | `roller.revealPhase` | 8 | [x] |
| T2 | End Goal Focus (d100) | `data.js` | `roller.revealEndGoal` | 8 | [x] |
| T3 | Pivot Plan Focus (d100) | `data.js` | `roller.revealPivot` | 4 | [x] |
| T4 | Plot Twists keywords (d100) | `data.js` | `roller.rollKeywords` | 100 | [x] |
| T5 | End Goal Roll constants (d10, +2/phase, ≥11) | `data.js` | `derived.endGoal*` | 1 | [x] |
| T6 | Procedure text: earned Discovery, phase generation, End Goal, Pivot timing | `data.js` | `screens`, `ui.explain` | 6 | [x] |
| T7 | Rules-library entries (one per automated rule) | `data-library.js` | `screens.renderLibrary` | 18 | [x] |
| T8 | Tutorial steps | `data-library.js` | `tutorial.js` | 10 | [x] |
| T9 | Worked examples (paraphrased) | `data-library.js` | `screens.renderLibrary` | 2 | [x] |

### 9.1a Rules Traceability Ledger

| Rule | Shape | Data | Engine | Surface | Test |
|---|---|---|---|---|---|
| `d10 + 2×phases ≥ 11` reveals the End Goal | Threshold | `END_GOAL_ROLL` | `derived.endGoalCheck` | Persistent header + reveal card | `threshold fires at exactly 11` |
| +2 per known phase | Escalation | `END_GOAL_ROLL.perPhase` | `derived.endGoalModifier` | Header "needs N+" | `modifier table matches 0/2/4/6/8/10` |
| The check precedes the Focus roll | — (sequence) | — | `roller.revealNext` | Reveal card order | `endgoal check is logged before the focus roll` |
| End Goal once per adventure | Once-per-X | — | `derived.endGoalRevealed` gate | Reveal action disabled with reason | `no second endgoal` |
| Pivot once per adventure | Once-per-X | — | `derived.pivotAvailable` | Arc screen | `second pivot requires override` |
| Pivot needs survival/underlings/failsafe | Gate | `PIVOT_GATE` | `roller.revealPivot` legality | Arc screen checkboxes + refusal text | `pivot refused with no eligibility` |
| No Context (81–100 / 84–100) | Exception | `*_FOCUS` rows | `rules.lookupRange().noContext` | Reveal card omits Focus text | `no-context rows carry the flag` |
| Roll two keywords | Lookup | `PLOT_TWISTS` | `roller.rollKeywords` | Reveal card | `keywords are 1..100 and complete` |
| Doubles are amplification | Permission/guidance | `GUIDANCE.doubles` | `roller.rollKeywords` sets `doubled` | Reveal card note | `doubled flag set when equal` |
| Earned Discovery is never rolled for | Permission | `GUIDANCE.earned` | `store.addPhase` via explicit control | Dossier action bar | `no dice are rolled by the earn control` |
| Every phase opens a lead | Guidance only | `GUIDANCE.leads` | `sheet.leadEditor` (guidance only) | Lead list + empty-state prompt | `lead persists` |
| End Goal unifies prior phases | Guidance only | `GUIDANCE.coherence` | `sheet.coherenceStep` (guidance only) | End Goal card lists prior phases | `coherence step lists every prior phase` |
| Arc boundaries fire a bundle + undo | — | `ARC_STAGES` | `lifecycle.advance` / `lifecycle.undo` | Arc screen summary modal | `undo restores the prior arc state` |
| Fate Question for a surprise Pivot | not in source | `NOT_IN_SOURCE`, `FATE_ANSWERS` | recorded, never rolled; a recorded No gates `derived.canRevealPivot` | Labelled control on the Arc screen | `app rolls no fate question`, `a recorded No blocks the pivot` |
| Villain behind the villain (End Goal 73-76) | Permission | `END_GOAL_FOCUS` row | `sheet.villainBehindStep` writing `villain.behind` | Control on the End Goal card + dossier field | `the villain behind the villain is a field` |
| A read reveal collapses; the list pages | — (density) | — | `sheet.phaseLine` / `DOSSIER_PAGE` | Dossier | layout probe: 2.3 viewports under stress |
| Roll log records every die | — | — | `store.pushLog` | Log screen + distribution | `every reveal writes one log row with its dice` |

## 10. Process rules

As template §10 and §10.1. In force here, and enforced by the harness where possible:
data only in `data*.js`; `CACHE_VERSION` bumped on any shipped-file change; every flag has
a setter, a reader and a clearer (the clearer for both Once-per-X flags is *a new
adventure*, since the source has no lower boundary); defaults follow the fiction; one
lookup per kind of thing (`rules.lookupRange` serves all three Focus tables); destructive
actions confirm and name the loss; every reversible-state action is inventoried below.

**Reversibility inventory (§10.18):** arc advance → undo · delete phase → confirm naming
the loss + undo · delete adventure → confirm naming the loss (export offered) · clear log →
confirm naming the loss · import → confirms it replaces everything, previous state pushed
to the undo stack.

## 11. Audit

Harnesses in `tests/`: `npm test` (parse gate + invariants + dead-data scan),
`npm run smoke`, `npm run interaction`, `npm run probe`. Findings in `docs/AUDIT.md`.
Stopping rule: one full cycle of all seven pass types with no finding.

## 12. Content & IP

Mechanics and numbers only; all prose paraphrased. The article's example adventures are
summarised, not reproduced. Personal play aid built from the user's own magazine issue —
see README. Repository stays private while it carries a transcription.

## Changelog

| Date | Change | Why | Verification | Cache |
|---|---|---|---|---|
| 2026-09-11 | Instantiated this spec from template v3; Stage A profile + shape census + rulings A1–A10 recorded | Stage B sign-off | n/a | — |
| 2026-09-11 | Built Phases 0–4 and 6: data files, 14 `src/` modules, PWA shell, dossier/reveal/arc/log/rules/settings/tutorial screens | The build | `npm test` 67, `npm run smoke` 304, `npm run interaction` 215, probes read | `schemer-v1` |
| 2026-09-11 | Audit cycle 1: F1–F22 fixed (see `docs/AUDIT.md`) | Findings from the parse gate, dead-data scan, rules read-through, interaction audit and layout/stress probes | all harnesses green after each fix | `schemer-v1` |
| 2026-09-11 | Rules read-through found two inert rules: a recorded Fate Question answer read by nothing (F20) and the "villain behind the villain" permission with no control (F21) | §0 defect class | unit tests added for both | `schemer-v1` |

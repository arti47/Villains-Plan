# Schemer — project spec (canonical)

Instantiated from *RPG Player-Character App — Autonomous Build Instructions v3*.
This file is canonical. **Every code change updates it in the same change** (§10.1).

Sources of record, in precedence order (§2.1):
1. `docs/villains-plan.md` — "The Villain's Plan", *Mythic Magazine* Vol. 69, pp. 16–28.
   Cited `MM69:p<page>`. Supplies the reveal system.
2. The **One-Page Mythic Game Master Emulator** (Word Mill Games), supplied as a page
   image. Cited `OPM`. Supplies Ask The Game Master, Random Events and Discover Meaning —
   the Mythic core the article leans on. Extracted into `data-mythic.js`.
3. **The Villain Crafter**, *Mythic Magazine* Vol. 41, pp. 3–16. Cited `MM41:p<page>`.
   Supplies the villain, their organization, and their lieutenants and minions — the thing
   the reveal system reveals. Extracted into `data-villain-crafter.js`.
4. **Meaning Tables: Elements**, *Mythic Game Master Emulator Second Edition* (Word Mill
   Games), supplied as page images. Cited `GME2e`. Twelve d100 word tables — the detail
   tables MM41:p5 sends you to for who the villain actually is. Extracted into
   `data-elements.js`. All twelve transcribed from the photographs, 100 unique words each,
   thirteen anchors pinned by test.
   **Blocked data: none outstanding. Every table verified against page photographs.**
   Three bands of the Minion column (42–44, 68–69, 75–76) were unreadable in the first
   transcription and shipped marked `unrecovered`; photographs of MM41:p14–15 closed the
   gap (Soldier is merged across 40–44, On A Mission across 68–76). Photographs of
   MM41:p6–7 and p10–11 then verified all 41 modifier triples — the transcript had
   de-interleaved the modifier column, so they had been paired by order with only three
   rows confirmable from the worked examples. Every one matched; no corrections. The unit
   harness now holds an independent transcription of both tables and fails on drift.

---

## 1. What this is

| | |
|---|---|
| **Game** | "The Villain's Plan" — a Mythic GME subsystem for revealing a villain's scheme in stages. **Not a full RPG.** |
| **Scope decision** | Build the Villain's Plan tool only (user decision, Stage B), plus the Mythic oracle once One-Page Mythic was supplied. What is in neither source — Chaos Factor, scene setup, Bookkeeping, Threads/Characters lists — stays **not implemented and not invented** (§2 hard rule). |
| **Audience** | A solo player/GM emulating a GM (Stage B: seat = solo). No GM screen. |
| **Platforms** | Phone-first installable PWA; browser and desktop follow. |
| **Core job** | Villain Crafter (archetype, organization, underlings) · adventure/villain dossier · earned-Discovery reveal engine · End Goal Roll state machine · Pivot Plan coda · the Mythic oracle (Ask, random events, Discover Meaning) · roll log · rules library · tutorial. |
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

Omitted because neither source has such mechanics (never invented):
character sheet · attributes/skills/derived stats · health/damage/death · rest · combat &
initiative · inventory/encumbrance/wealth · powers · advancement · conditions · bestiary ·
NPCs · pregens · GM tables · safety tools.
Mythic parts still unsourced and still not approximated (`STILL_NOT_IN_SOURCE`): the Chaos
Factor (the one-page edition drops it by design) · scene setup (Expected/Altered/Interrupt)
· the Bookkeeping phase · Threads and Characters lists · the Villain Crafter (MM #41).
Therefore absent by design: `data-monsters.js`, `data-npcs.js`, `data-pregens.js`,
`data-solo.js`, `power-automation.js`, `solo.js`, `gm.js`, `combat.js`, `wizard.js`'s
character path (it builds an adventure dossier instead).

House aids (§2.2): **none.** No invented tables ship.

---

## 3. System Profile (completed, Stage A)

Extraction is complete: the source is 11 pages and every table, formula and procedure in
it is in `data.js`. See `docs/villains-plan.md` for the full extraction.

**3.1 Core resolution.** The reveal subsystem has no task resolution of its own: `d100` on
three Focus tables, `d100` ×2 on Plot Twists, `d10` for the End Goal Roll. One-Page Mythic
adds the real resolution mechanic — **1d100 against a nine-row odds chart** yielding
Exceptional Yes / Yes / No / Exceptional No, with a double-digit roll also firing a random
event. No crit/fumble beyond that, no push economy, no cascades.
*Family (§15): percentile oracle over a narrative, Permission-dense core — the risk is the
app becoming a notepad, which is why the oracle earns its own tab.*

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

**3.18 Bestiary / NPCs.** No stat blocks in any source — MM41 hands NPC statistics back to
whatever system you are playing (a guess, then a Fate Question), and this app has no system
attached, so it holds none. What it does hold is **archetypes**: the villain, their
organization, and a roster of lieutenants and minions, each with the roll that produced it.

**3.19 Pregens.** None. The two worked examples (General Gorazon, Cold Rock Cold Heart) are
*illustrations*, shipped as read-only examples in the rules library, never instantiable
adventures (they are setting content of the article's own invention — paraphrased, §12).

**3.20 Solo rules.** The whole app is a solo/GM-emulator aid. The article publishes no
oracle beyond its four tables; One-Page Mythic publishes the oracle proper, which is the
Oracle tab (Ask · Meaning), gated by one setting that is on by default.

**3.21 GM tables.** The three Focus tables are the GM tables. No separate GM screen (seat = solo).

**3.22 Safety tools.** None in source. Recorded as absent.

### 3.0 Rule-shape census — what this app must be good at

| Shape | Count | Rules |
|---|---|---|
| Lookup | 22 | Villain Plan Focus, End Goal Focus, Pivot Plan Focus, Plot Twists, Ask The Game Master (9 rows × 4 bands), Discover Meaning Action, Discover Meaning Description, Villain Archetype, Villain Organization, Lieutenants & Minions, and the twelve GME2e Elements tables behind one registry |
| Threshold | 1 | `d10 + 2×phases ≥ 11` reveals the End Goal |
| Escalation | 2 | +2 per known phase · the Crafter's modifiers carried archetype → organization → underlings |
| Once-per-X | 2 | End Goal once per adventure; Pivot once per adventure |
| Gate | 3 | Pivot requires survival / underlings at large / a failsafe · a recorded or rolled No on the pivot question blocks it · the organization roll needs the archetype whose modifier it carries |
| Exception | 3 | "No Context" branches (81–100 and 84–100) skip the Focus text; a double-digit Ask roll fires a random event as well as the answer |
| Permission | 5 | Earn a Discovery · interpret & revise freely · override a second Pivot · name the villain behind the villain · keep rolling Discover Meaning words until it comes clear |
| Guidance only | 4 | every phase opens a lead · End Goal must unify prior phases · Pivot arc ≤3 scenes · reveal the Pivot immediately |

| Cascade | 3 | Double Archetypes (roll two, combine; a nested Double is re-rolled) · Upscale (roll again bigger, re-rolling Upscale and Double) · Teamwork (roll a partner; a second Teamwork reads As Expected) |

Absent shapes: Modifier, Cost, Future cost, Compulsion, Substitution, Conversion, Blocker,
Opposed. **There is no Future-cost rule in any of the three sources** — the one shape §15
says every family forgets does not exist here, recorded so no later pass hunts it.
**Cascade arrived with the third source**, and promptly failed in the way §3.0 predicts —
see `docs/AUDIT.md` F28.

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
| A11 | Default odds | 50/50 on every visit, and any unknown odds key falls back to it. The book gives 50/50 for "even or you don't know"; defaulting anywhere else would put a thumb on the scale. |
| A12 | What counts as a double | 11, 22 … 99. A flat 100 is not a double-digit number and fires no event. |
| A13 | Which column a random event rolls | One **Action** word — an event is what happens — with the book's own "get more words" control for the rest. |
| A14 | *Revises A7.* The Fate Question | With One-Page Mythic supplied, the app rolls it: the Arc screen offers odds and asks. The manual-record path stays for physical dice. Either way the answer is binding — a No blocks the pivot roll. |
| A15 | "Keep rolling until it comes clear" | An unbounded, explicit repeat control. Nothing rolls a second word automatically. |
| A16 | Crafter modifier accumulation | The archetype modifies the organization roll; archetype and organization together modify lieutenant and minion rolls. A Double Archetype adds both halves. The screen prints the arithmetic. |
| A17 | Crafter "Meaning Table" results | Rolled on One-Page Mythic's Action column — the only Action meaning table this app has. With the oracle off, the row is reported without a word rather than faked. |
| A18 | Nested Double / Upscale / Teamwork | Re-rolled at the draw, never expanded, exactly as the tables say. This is also what makes the cascades finite (F28). |
| A19 | The three unreadable Minion bands | *Closed.* They shipped marked `unrecovered` and never invented; page photographs then supplied them (merged cells: Soldier 40–44, On A Mission 68–76). The gap-handling UI was removed with the gap rather than left inert. |
| A20 | Lieutenant or minion | Chosen before the roll, as the article instructs, because the modifier differs. |
| A21 | Modifiers past the ends of a table | No clamping: the Crafter's top and bottom bands are open-ended and are what absorb them. |
| A22 | Underlings before an organization | Allowed. The organization's contribution counts as 0 and the breakdown says "organization not rolled yet" rather than implying the modifier is complete. |

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
| `data-mythic.js` | Second source (OPM): the odds chart, the four answers, the random-event rule, Discover Meaning, and what is still unsourced |
| `data-villain-crafter.js` | Third source (MM41): villain archetypes with their modifiers, organizations, lieutenants and minions |
| `data-elements.js` | Fourth source (GME2e): the twelve Elements meaning tables, and which seven MM41 names for villain details |
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
| `oracle.js` | The Mythic oracle: Ask The Game Master, random events, Discover Meaning, the pivot question, and both oracle screens |
| `crafter.js` | The Villain Crafter: archetype, organization and underling rolls with their cascades and carried modifiers, and the Villain screen |
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
    villain: { name, epithet, known, forces, behind,     // behind: End Goal Focus 73-76
               details: [ { id, tableId, table, roll, word, at } ],   // GME2e Elements
               crafted: { archetype: { rolls, parts[], words[], mods{o,l,m}, note } | null,
                          organization: { rolls, parts[], words[], mods{l,m}, upscaled, note } | null,
                          lieutenants: [ { id, kind, rolls, parts[], mod, name, details[] } ],
                          minions:     [ { …the same shape } ] } },
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
               question, summary, outcome } ],   // capped 200; question only on asks
  settings: { theme, textScale, showGuidance, mythicOracle }
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
| T10 | Ask The Game Master chart (9 odds × 4 bands) | `data-mythic.js` | `rules.askResult` | 9 | [x] |
| T11 | The four answers + the random-event rule | `data-mythic.js` | `oracle.ask` | 4+1 | [x] |
| T12 | Discover Meaning (50 rows × 2 columns) | `data-mythic.js` | `rules.discoverWord` | 50 | [x] |
| T13 | Ask procedure + oracle guidance + what is still unsourced | `data-mythic.js` | `oracle`, `screens` | 4+5+5 | [x] |
| T14 | Villain Archetype (d100) with o/l/m modifiers | `data-villain-crafter.js` | `crafter.rollArchetype` | 23 | [x] all 23 modifier triples verified against page photographs |
| T15 | Villain Organization (d100 + mod) with l/m modifiers | `data-villain-crafter.js` | `crafter.rollOrganization` | 18 | [x] all 18 modifier pairs verified against page photographs |
| T16 | Lieutenants & Minions (d100 + mod), both columns | `data-villain-crafter.js` | `crafter.rollUnderling` | 23 | [x] all bands verified against page photographs |
| T17 | Crafter guidance: staging, interpretation, modifiers, statistics, provenance | `data-villain-crafter.js` | `crafter` | 6 | [x] |
| T18 | Meaning Tables: Elements (12 × d100) | `data-elements.js` | `rules.meaningWord`, `oracle.discover`, `crafter.detailsCard` | 1200 | [x] transcribed from page photographs; 13 anchors pinned |

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
| 1d100 against the odds row gives one of four answers | Lookup | `ASK_ODDS`, `ASK_ANSWERS` | `rules.askResult` | Ask screen, bands drawn to scale | `every odds row covers 1-100 exactly once`, `boundaries land on the published numbers` |
| Odds default to 50/50, unknown falls back to it | — | `ASK_ODDS[].default` | `rules.defaultOdds` / `oddsRow` | Odds chips | `unknown odds fall back to 50/50` |
| A double-digit Ask roll fires a random event too | Exception | `RANDOM_EVENT.doubles` | `rules.askResult().double` → `oracle.ask` | Event block on the answer card | `doubles fire a random event; 100 does not` |
| An event is read from one Action word, more on request | Permission | `DISCOVER_MEANING` | `oracle.discover` | Event block + "add another word" | `an ask writes one log row, and a double writes the event die with it` |
| Discover Meaning: one word at a time, unbounded | Permission | `DISCOVER_MEANING` | `oracle.discover` | Meaning screen reading | `rolls one word at a time and logs each` |
| The pivot question can be rolled, and binds | Gate | `ASK_ODDS`, `FATE_ANSWERS` | `oracle.askPivot` → `derived.canRevealPivot` | Arc screen ask row | `asking the pivot question writes the answer the gate reads` |
| Archetype emits the modifiers everything else carries | Escalation | `VILLAIN_ARCHETYPES[].mods` | `crafter.modifierBreakdown` | Villain screen, arithmetic printed | `the article's own example arithmetic comes out right`, `every archetype modifier matches the page` |
| Organization is rolled at the archetype's modifier | Gate | `VILLAIN_ORGANIZATIONS` | `crafter.canRollOrganization` | Disabled control + refusal naming the rule | `the organization roll is gated on the archetype` |
| Double Archetypes: roll two, combine; a nested Double is re-rolled | Cascade | `SPECIAL.double` | `crafter.expand` banned set | Both archetypes shown with a note | `a nested Double is re-rolled, not expanded`, `every crafter cascade terminates` |
| Upscale: roll again bigger, both sets of modifiers | Cascade | `SPECIAL.upscale` | `crafter.expand` | Upscale note on the organization card | `Upscale rolls again and keeps both sets of modifiers` |
| Teamwork: a partner archetype; a second reads As Expected | Cascade | `UNDERLINGS` teamwork row | `crafter.expand` | Teamwork note on the card | `Teamwork rolls a partner archetype` |
| Open-ended bands absorb the modifiers | Lookup | `±Infinity` bands | `rules.lookupOpen` | — | `the modified tables are open-ended` |
| Every minion band resolves to an archetype | Lookup | `UNDERLINGS[].minion` | `crafter.entryFor` | Underling card | `every band of the minion column is readable`, `no minion roll can come back without an archetype` |
| Villain statistics stay at your table | guidance only | `CRAFTER_GUIDANCE.stats` | not automated, and marked so | Rules library entry | — |
| The villain's details come from the Elements tables | Lookup | `ELEMENT_TABLES` | `rules.meaningWord` → `crafter.rollDetail` | Step 2 of the Villain screen, and each underling card | `all twelve Elements tables carry 100 unique words`, `Elements words sit at the rolls the page shows` |
| MM41 names seven detail tables | — | `VILLAIN_DETAIL_TABLES` | `rules.villainDetailTables` | Those seven as chips, the rest behind a fold | `the seven tables The Villain Crafter names are all present` |
| Every meaning table, both sources, one lookup | Lookup | registry in `rules.js` | `rules.meaningWord` (`span` 2 for OPM, 1 for Elements) | Meaning screen picker, grouped | `the meaning registry covers both sources, with the right span each` |
| The oracle is one toggle, on by default | — | `Settings.mythicOracle` | `router` tab gating | Settings + a gated route that explains itself | `the oracle toggle hides its tab and its routes explain themselves` |

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
| 2026-09-11 | Second source extracted (One-Page Mythic): `data-mythic.js`, `src/oracle.js`, an Oracle tab with Ask and Meaning, random events, and the pivot question wired to the gate that already honoured it | The user supplied the page; it unblocks everything ruling A7 had marked not-in-source | `npm test` 81, `npm run smoke` 403, `npm run interaction` 286, probes read, screenshots checked | `schemer-v2` |
| 2026-09-11 | Third source extracted (The Villain Crafter): `data-villain-crafter.js`, `src/crafter.js`, a Villain screen under the Dossier tab, modifiers carried between the three tables, and the three cascades | The user supplied the pages; MM41 was the last thing `STILL_NOT_IN_SOURCE` named that the app could use | `npm test` 98, `npm run smoke` 436, `npm run interaction` 331, probes read, screenshot checked | `schemer-v3` |
| 2026-09-11 | Minion column completed from page photographs; `unrecovered` handling and its UI removed with the gap | The user supplied MM41:p14–15; merged cells explain all three bands | `npm test` 99, `npm run smoke` 436, `npm run interaction` 331 | `schemer-v4` |
| 2026-09-11 | MM41:p6–7 and p10–11 photographs verified all 41 Crafter modifier triples against the shipped data: zero corrections. An independent transcription of both tables now lives in the harness | The modifier column had been de-interleaved and paired by order, with only three rows confirmable from worked examples — the largest silent-error risk left in the app | `npm test` 102 | `schemer-v4` |
| 2026-09-11 | Fourth source extracted (GME2e Meaning Tables: Elements): `data-elements.js`, one meaning-table registry behind `rules.meaningWord`, a details step on the Villain screen and on every underling, and all twelve tables on the Meaning screen | The user supplied the pages; MM41:p5's "Villain Details" step had nowhere to point until now | `npm test` 108, `npm run smoke` 436, `npm run interaction` 363, probes read, screenshot checked | `schemer-v5` |
| 2026-09-11 | Audit cycle 3b: F34 (the interaction audit signed the screen by length and missed a chip swap that preserved it — a false finding), F35 (the details step was numbered 4 and sat in the wrong place) | New source, new passes | the audit's change detector now hashes content and records pressed state | `schemer-v5` |
| 2026-09-11 | Audit cycle 3: F28–F31 (Double Archetypes expanded recursively and diverged at large modifiers; the villain roster hit 8.7 viewports; the seeds did not cover the crafted state; the citation check was a source behind) | New source, new passes | all harnesses green; a cascade-termination test now runs at a hostile modifier | `schemer-v3` |
| 2026-09-11 | Audit cycle 2: F24–F27 (six tabs collided at 320px and the harness could not see it; the Settings gear was inert on Settings; a card written and never mounted; the citation check assumed one source) | New source, new passes | all harnesses green; `fixedBarFit` added so the tab bar is measured on every route | `schemer-v2` |

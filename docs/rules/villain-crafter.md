# The Villain Crafter — archetype, organization, underlings

Distilled from *The Villain Crafter*, Mythic Magazine Vol. 41, pp. 3–16, cited `MM41:p<n>`.
The third source, and the one "The Villain's Plan" names as where the villain comes from.

## The order, and why it is fixed

1. **Villain Archetype** (d100, no modifier) — who they are. It emits three modifiers.
2. **Villain Organization** (d100 + the archetype's *o*) — what stands behind them. It emits
   two more.
3. **Lieutenants and minions** (d100 + archetype *l/m* + organization *l/m*).

The organization roll is gated on the archetype, because it carries the archetype's
modifier; the engine refuses and names the rule rather than silently rolling at +0.
Underlings may be rolled before the organization exists — the breakdown then says
"organization not rolled yet" instead of pretending the modifier is complete (A22).

## Modifiers — Escalation carried between tables

Every archetype and organization row carries its modifiers in the data; nothing is inlined.
A Double Archetype adds both halves (A16). The screen prints the arithmetic, and the
harness pins it against the article's own worked example: Has No Choice + One Of The People
+ The Company gives **+15 lieutenants, +20 minions**, and its rolls (42+10 → The Company;
28+15 → Tough Stuff; 7+20 → Groveler) all reproduce.

## The cascades — the shape that ships broken

Three rules say "roll again", and each carries its own termination:

- **Double Archetypes** → roll two and combine. *A further Double is ignored and re-rolled*,
  never expanded. This matters: at a large modifier the organization table lands on Double
  more often than not, and expanding recursively diverges (docs/AUDIT.md **F28** — it
  shipped that way first and the termination test caught it).
- **Upscale** (organization) → roll again and read the result bigger, keeping both sets of
  modifiers; Upscale and Double are both re-rolled on that follow-up.
- **Teamwork** (underlings) → roll a partner archetype; Teamwork rolled again reads as
  As Expected.

Engine: one `expand()` with an explicit `banned` set per depth, in `src/crafter.js`.

## Open-ended bands

The organization and underling tables have open top and bottom bands ("8 or less",
"81 or more"), which is exactly what absorbs a large modifier. `rules.lookupOpen` uses
±Infinity rather than clamping the roll (A21), and the harness checks every total from
−50 to 200 returns exactly one row.

## Meaning Table results

Both tables can send you to Mythic's Action meaning table. This app has that table, from
One-Page Mythic, so the result is rolled and a real word comes back (A17) — logged like any
other die. With the oracle switched off the row is reported without a word.

## The source gap

Three bands of the **Minion** column did not survive the supplied page: **42–44, 68–69,
75–76**. They are marked `unrecovered` in the data and never filled in (A19, §2.1). When a
minion roll lands on one the app says so, shows the Lieutenant entry from the same band as
context, and offers two honest outs: roll again, or take that entry by your own choice
(recorded as chosen, not as the source). One photograph of that page would close it.

## What this app does not take from the article

Villain statistics. The article turns a villain into numbers by guessing a value and asking
the Game Master whether that is it. This app has no game system attached and holds no stat
blocks, so that stays at the table — recorded in the library rather than half-built.

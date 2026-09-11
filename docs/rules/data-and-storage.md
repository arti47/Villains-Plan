# Data, storage and the roll log

## Where the rules live

Every number, row and procedure is in `data.js` / `data-library.js` with an `MM69:p<page>`
citation. No `src/` module may hold a rules value; the unit harness enforces this for the
threshold and checks that every table, guidance entry and library id reaches a consumer.

## The dice

`crypto.getRandomValues` with rejection sampling (no modulo bias). `Math.random` is banned
and the harness greps for the call. Every roll shows its individual faces and the table it
was read on; a roll is stored once and every render reads the stored value, so nothing
re-rolls on a re-render — the smoke harness asserts that across a route change.

## The roll log

One row per reveal: the dice in the order they were rolled, the summary, the outcome, and
which adventure it belonged to. Capped at 200 rows, newest first, filterable by adventure
and kind, with a per-face distribution view for d10 and per-decile for d100.

## Storage and migration

`localStorage`, plain JSON, one key. `derived.normalizeAdventure` back-fills any earlier
shape and is also what clears spent once-per-adventure flags; ordinals are recomputed on
every load rather than trusted, so two paths cannot disagree about which phase is which.
`tests/fixtures/old-shape.json` is a hand-written pre-list record the harness loads to
prove the migration runs.

Export is JSON (round-trip tested) plus a readable per-adventure text dossier. Import
replaces everything, snapshots first, and refuses anything that is not a backup.

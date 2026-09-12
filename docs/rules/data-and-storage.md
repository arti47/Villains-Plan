# Data, storage and the roll log

## Where the rules live

Every number, row and procedure is in a `data*.js` file with a citation to its source. No
`src/` module may hold a rules value; the unit harness enforces this for the threshold,
checks that every export reaches a consumer, and — since F51–F53 — that **every field** of
every export is read by something in `src/`, so a rule cannot sit in the data unread.

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

## Backups

A ring of the last five full-state snapshots, under a second storage key, taken
automatically **before** anything irreversible — an arc boundary, a delete, an import —
and by hand from Settings. Each restores in one confirmed tap (and the restore itself is
undoable, because it snapshots first), and each saves to a file in the same shape as an
export, so it imports anywhere an export does. They live in the same browser storage as
the state they protect: a bad import or a deleted adventure is recoverable; a cleared site
is not, which is why "Save to file" sits beside every row. If storage is full the oldest
is dropped and the write retried once; if that fails the boundary still fires and the
Settings control says so rather than throwing mid-play.

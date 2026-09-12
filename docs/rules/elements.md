# Meaning Tables: Elements (GME2e)

Twelve d100 word tables from *Mythic Game Master Emulator Second Edition*, cited `GME2e`.
The fourth source, and the one that finally gives MM41:p5's "Villain Details" step
somewhere to point.

| Table | What it answers |
|---|---|
| Character Identity | Who they are, or the role they fill |
| Character Skills | What they are good at |
| Character Motivations | Why they want what they want |
| Character Personality | How they think and behave |
| Character Appearance | What they look like |
| Character Traits & Flaws | The quirk, the edge, the weakness |
| Character Background | Where they came from |
| Character Descriptors | A general word for what someone is like |
| Character Actions, Combat | What someone does in a fight |
| Character Actions, General | What someone does outside one |
| Character Conversations | How a conversation goes, or what it is about |
| City Descriptors | What a place is like |

The first seven are the ones The Villain Crafter names; they are the chips on the Villain
screen, and the other five are a fold away.

## One registry, two sources

`rules.js` holds every meaning table the app can roll behind a single lookup —
`meaningWord(tableId, roll)` — including One-Page Mythic's two Discover Meaning columns.
The only difference is `span`: OPM prints 50 rows over 100 numbers, the Elements tables
print 100, so the lookup divides by the span rather than each caller knowing which is
which (§10.16). Every surface rolls through it: the Meaning screen, the villain's details,
an underling's details, and the word a random event is read from.

## Where details live

A detail is `{ tableId, table, roll, word }` and hangs off either the villain or one named
underling. Rolling one goes through the same `oracle.discover` as any other word, so it
lands in the roll log with its table and its die like everything else — nothing in this app
rolls in private.

## What else GME2e supplied

The Elements tables were the first GME2e material; the Fate Chart, the Action tables, the
scene loop, the Chaos Factor and its variants, the two lists and the Thread Progress Track
followed from the same book, each from its own page or quotation — see `oracle.md` and
`scenes.md`.

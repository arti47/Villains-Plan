# Reveals — the Discovery arc

Distilled from `docs/villains-plan.md` (MM69:p18-22). The audit reads this file sentence
by sentence against the engine and asks: where does this happen in code?

## Earning a reveal — Permission

A reveal is granted by the player's judgement when the character has done enough. It is
explicitly *not* a Fate Question: the article says to let the momentum of the scene carry
it rather than the dice.

- Engine: no engine. There is one control (`sheet.earnReveal` → `roller.revealNext`) and
  nothing rolls to decide whether it fires.
- Surface: the pinned action on the Reveal screen, and the same action on the Dossier.
- Optional note ("why this was earned") goes to the session record.

## The order of a reveal — sequence

1. End Goal Roll (`d10 + 2 per known phase`, against 11).
2. The Focus roll, on the table the check selected.
3. Two Plot Twists keywords.

- Engine: `roller.revealNext` performs them in that order; the log row's `dice[0]` is the
  d10 and the harness asserts it.

## The End Goal Roll — Threshold + Escalation

`d10 + 2×phasesKnown ≥ 11`.

| Reveal | Known | Bonus | Needs | Chance |
|---|---|---|---|---|
| 1st | 0 | +0 | impossible | 0% |
| 2nd | 1 | +2 | 9+ | 20% |
| 3rd | 2 | +4 | 7+ | 40% |
| 4th | 3 | +6 | 5+ | 60% |
| 5th | 4 | +8 | 3+ | 80% |
| 6th | 5 | +10 | any | 100% |

- Engine: `derived.endGoalCheck`, `derived.endGoalModifier`, `derived.endGoalNeeded`,
  `derived.endGoalLadder`. The threshold and the per-phase bonus are in `END_GOAL_ROLL`;
  the unit harness fails if either appears as a literal in `src/`.
- Surface: the persistent header ("End Goal needs 5+"), the Reveal screen's threshold card
  and its ladder, and the check block on every reveal card.
- Only phases count toward the bonus — not the End Goal, not a pivot (ruling A2).

## Focus tables — Lookup, with a No Context Exception

Villain Plan Focus (phases) and End Goal Focus (the finale) are d100 tables whose top rows
give no context at all. That is a result, not a re-roll: the two keywords carry the reveal.

- Engine: `rules.lookupRange` (one range lookup for all three tables) sets `noContext`.
- Surface: the reveal card prints the roll and the label, and replaces the Focus text with
  the No Context note plus a link to the rule.

## Keywords — Lookup ×2, doubles kept

Two d100 rolls on the hundred-word Plot Twists list. A double is amplification.

- Engine: `roller.rollKeywords` sets `doubled` when the rolls match; nothing re-rolls.
- Surface: two keyword pills with their rolls, and a note when doubled.
- An explicit "re-roll keywords" control exists, confirms, says the rules do not ask for
  it, and is logged as a re-roll.

## What a reveal must do — guidance only

A phase explains one thing and raises another; the raised half is the next scene. The app
does not enforce this (it cannot read your prose), but it prompts for it and counts the
leads you write in the persistent header.

## Once the End Goal is out — Once-per-X

There is nothing left to discover: the reveal control refuses and says why, and the arc
moves to Foiling. Deleting the End Goal reopens the Discovery arc.

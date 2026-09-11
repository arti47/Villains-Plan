# Arcs, the pivot, and what is not in this source

Distilled from `docs/villains-plan.md` (MM69:p25-26).

## Arcs

Discovery → Foiling → (optional) Pivot → Concluded. The article frames an adventure in
arcs, not scenes; scene-level structure belongs to Mythic's core rules, which this source
does not contain, so the app owns arc boundaries only.

- Engine: `lifecycle.previewAdvance` / `lifecycle.advance`, stages in `ARC_STAGES`.
- Every boundary reports its bundle line by line and leaves one step of undo.
- Discovery cannot be left until the End Goal is out; the action is disabled and the
  refusal names the rule.
- Foiling is expected to run as long as the Discovery arc did — stated in the arc blurb.

## The pivot gate — Gate

A Plan B needs someone left to enact it: the villain survived, important underlings are at
large, or a failsafe was set in advance.

- Engine: `derived.canRevealPivot`, refusing with `PIVOT_GATE.refusal`.
- Surface: three labelled checkboxes on the Arc screen; the refusal prints beneath the
  disabled control.

## One pivot — Once-per-X, with a Permission

The article gives a beaten villain one Plan B. A second is available only through an
explicit override, which is logged and cleared by use (and by reload).

## Timing and length — guidance only

Reveal the pivot in the scene right after the plan falls; keep it to one to three scenes.
Surfaced on the Arc screen and on every pivot card.

## The surprise route — not in this source

The alternative is to ask a Fate Question in a cleanup scene: Yes or Exceptional Yes and
the villain pivots. Fate Question odds are Mythic core, not this article, so the app
**does not roll it**. It records the answer you resolved elsewhere — and that record is
load-bearing: a No blocks the pivot roll, with a refusal that cites the answer.

## What else is missing from this source

Chaos Factor · scene setup (Expected / Altered / Interrupt) · the Bookkeeping phase ·
Discover Meaning (Action and Descriptor tables) · Random Events · Threads and Characters
lists · The Villain Crafter (Mythic Magazine #41). Listed in the rules library under
"What this app does not do", and never approximated.

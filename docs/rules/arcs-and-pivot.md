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

## The surprise route — a Fate Question, rolled

The alternative is to ask a Fate Question in a cleanup scene: Yes or Exceptional Yes and
the villain pivots. The odds are Mythic core, not this article, so this shipped first as a
recorded answer only; once the oracle arrived the app rolls it (A14, revising A7), and a
by-hand record stays for physical dice. Either way the answer is load-bearing: a No blocks
the pivot roll, with a refusal that cites the answer.

## What this source does not contain

Everything Mythic-core — the Chaos Factor, scene setup, Bookkeeping, meaning tables,
random events, the two lists — and the Villain Crafter. All of it has since been supplied
from its own source and built; see the other files in this directory.

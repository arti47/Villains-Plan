// lifecycle.js — arc boundaries. The app owns these events: each fires a bundle,
// reports exactly what changed, and offers one step of undo (§3.12, §6.4).

import { now } from "./core.js";
import { arcStage, arcLabel } from "./rules.js";
import { arcStageKey, endGoalRevealed, pivotPhases, pivotEligibility, openLeads } from "./derived.js";
import * as store from "./store.js";

/**
 * What moving to the next arc would do, without doing it. The Arc screen renders
 * this, and the confirmation modal shows the same lines back.
 */
export function previewAdvance(adv) {
  if (!adv) return null;
  const stage = arcStageKey(adv);
  const current = arcStage(stage);
  if (!current.next) return null;
  const next = arcStage(current.next);
  const changes = [];
  let blocked = null;

  if (stage === "discovery") {
    if (!endGoalRevealed(adv)) {
      blocked = "The Discovery arc ends when the End Goal is revealed. Earn reveals until the End Goal Roll fires.";
    } else {
      changes.push("Arc moves from Discovery to Foiling.");
      changes.push("No further reveals can be earned - the plan is known.");
    }
  }
  if (stage === "foiling") {
    changes.push("The plan is marked defeated, and the arc moves to Pivot.");
    changes.push("The Pivot Plan becomes available if the villain can still act.");
    const open = openLeads(adv).length;
    if (open > 0) changes.push(`${open} lead${open === 1 ? "" : "s"} stay open and un-followed.`);
  }
  if (stage === "pivot") {
    changes.push("The adventure is concluded and kept as a record.");
    if (pivotPhases(adv).length === 0) changes.push("No Pivot Plan was rolled - the villain simply loses.");
    const { any } = pivotEligibility(adv);
    if (any && pivotPhases(adv).length === 0) changes.push("The pivot conditions you ticked will go unused.");
  }

  return { from: current, to: next, changes, blocked, label: current.nextLabel };
}

/** Fire the boundary. Snapshots first so undo is one step (§10.18). */
export function advance(adv) {
  const preview = previewAdvance(adv);
  if (!preview) return { ok: false, reason: "This adventure is concluded." };
  if (preview.blocked) return { ok: false, reason: preview.blocked };

  store.snapshot(`moving to ${preview.to.label}`);
  // The moments worth keeping are the irreversible ones (the user's decision on backups).
  store.backup(`before ${preview.label.toLowerCase()}`);
  const stamps = {};
  if (preview.to.key === "foiling") stamps.endGoalAt = now();
  if (preview.to.key === "pivot") stamps.defeatedAt = now();
  if (preview.to.key === "concluded") stamps.concludedAt = now();
  store.setArcStage(adv.id, preview.to.key, stamps);
  store.record(adv.id, "arc", `${preview.label}: arc moved from ${preview.from.label} to ${preview.to.label}.`);
  return { ok: true, preview, summary: preview.changes, to: preview.to };
}

/** Step back to the previous arc without the bundle — the explicit undo path. */
export function undo() {
  const label = store.undo();
  return label ? { ok: true, label } : { ok: false, reason: "There is nothing to undo." };
}

export function undoAvailable() { return store.undoAvailable(); }
export { arcLabel };

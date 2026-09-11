// roller.js — the reveal engine. The only place dice are rolled.
// Order is fixed by the rules: the End Goal Roll first, then the Focus, then two
// keywords (MM69:p22). Everything rolled is stored once and rendered from storage;
// nothing re-rolls on a re-render (§5.1).

import { d10 as rollD10, d100 as rollD100, uid, now } from "./core.js";
import { lookupRange, keyword, focusTableFor } from "./rules.js";
import { endGoalCheck, canEarnReveal, canRevealPivot } from "./derived.js";
import * as store from "./store.js";

/** Two keywords from Plot Twists. A double is amplification, never a re-roll (A5). */
export function rollKeywords() {
  const a = keyword(rollD100());
  const b = keyword(rollD100());
  return { keywords: [a, b], doubled: a.roll === b.roll };
}

function focusFor(kind) {
  const table = focusTableFor(kind === "endgoal" ? "endgoal" : kind === "pivot" ? "pivot" : "phase");
  const roll = rollD100();
  return lookupRange(table, roll);
}

function dieRows(check, focus, keywords) {
  const rows = [];
  if (check) rows.push({ die: "d10", value: check.d10, table: "End Goal Roll" });
  if (focus) rows.push({ die: "d100", value: focus.roll, table: focus.tableName });
  for (const k of keywords || []) rows.push({ die: "d100", value: k.roll, table: "Plot Twists" });
  return rows;
}

/**
 * Earn a reveal. Rolls the End Goal check first, then generates either another phase
 * or the End Goal from the result. Returns { ok, phase, check } or { ok:false, reason }.
 */
export function revealNext(adv, { earnedNote = "" } = {}) {
  const legality = canEarnReveal(adv);
  if (!legality.ok) return { ok: false, reason: legality.reason };

  const check = endGoalCheck(adv, rollD10());       // Threshold, before anything else
  const kind = check.fired ? "endgoal" : "phase";
  const focus = focusFor(kind);
  const { keywords, doubled } = rollKeywords();

  const phase = {
    id: uid("ph"), kind, createdAt: now(), revisedAt: null,
    earnedNote: String(earnedNote || "").trim(),
    interpretation: "",
    focus, keywords, doubled, check,
    leads: []
  };

  const saved = store.addPhase(adv.id, phase);
  store.pushLog({
    adventureId: adv.id,
    kind,
    dice: dieRows(check, focus, keywords),
    summary: `${focus.label} + ${keywords.map((k) => k.word).join(", ")}`,
    outcome: check.fired
      ? `End Goal revealed (${check.total} vs ${check.threshold})`
      : `Phase ${saved ? saved.ordinal : ""} (${check.total} vs ${check.threshold})`
  });
  store.record(adv.id, kind === "endgoal" ? "endgoal" : "phase",
    kind === "endgoal"
      ? `End Goal revealed: ${focus.label} + ${keywords.map((k) => k.word).join(", ")}.`
      : `Phase ${saved ? saved.ordinal : ""} revealed: ${focus.label} + ${keywords.map((k) => k.word).join(", ")}.`);

  return { ok: true, phase: saved, check, endGoal: check.fired };
}

/**
 * Roll the Pivot Plan. Gated on the article's three conditions and on one pivot per
 * adventure unless overridden (A6).
 */
export function revealPivot(adv, { earnedNote = "" } = {}) {
  const legality = canRevealPivot(adv);
  if (!legality.ok) return { ok: false, reason: legality.reason };

  const focus = focusFor("pivot");
  const { keywords, doubled } = rollKeywords();
  const override = !!adv.pivotOverride;

  const phase = {
    id: uid("ph"), kind: "pivot", createdAt: now(), revisedAt: null,
    earnedNote: String(earnedNote || "").trim(),
    interpretation: "",
    focus, keywords, doubled, check: null, override,
    leads: []
  };

  const saved = store.addPhase(adv.id, phase);
  store.pushLog({
    adventureId: adv.id,
    kind: "pivot",
    dice: dieRows(null, focus, keywords),
    summary: `${focus.label} + ${keywords.map((k) => k.word).join(", ")}`,
    outcome: override ? "Pivot Plan (override)" : "Pivot Plan"
  });
  store.record(adv.id, "pivot", `Pivot Plan: ${focus.label} + ${keywords.map((k) => k.word).join(", ")}.`);
  if (override) store.setPivotOverride(adv.id, false);
  return { ok: true, phase: saved };
}

/** Re-roll only the keywords of an existing reveal, explicitly, at the player's request. */
export function rerollKeywords(adv, phaseId) {
  const { keywords, doubled } = rollKeywords();
  const phase = store.updatePhase(adv.id, phaseId, { keywords, doubled });
  if (!phase) return { ok: false, reason: "That reveal is gone." };
  store.pushLog({
    adventureId: adv.id, kind: "keywords",
    dice: dieRows(null, null, keywords),
    summary: keywords.map((k) => k.word).join(", "),
    outcome: "Keywords re-rolled at the player's request"
  });
  return { ok: true, phase };
}

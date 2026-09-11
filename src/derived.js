// derived.js — everything computed from an adventure. Pure functions plus the
// normalization/migration path. No DOM, no storage.

import { END_GOAL_ROLL, PIVOT_GATE, ARC_STAGES, FATE_ANSWERS } from "../data.js";
import { uid, now } from "./core.js";

// ------------------------------------------------------------------ phases
export const phases = (adv) => (adv && Array.isArray(adv.phases) ? adv.phases : []);
/** Phases that feed the End Goal Roll modifier: revealed, non-final (ruling A2). */
export const planPhases = (adv) => phases(adv).filter((p) => p.kind === "phase");
export const endGoalPhase = (adv) => phases(adv).find((p) => p.kind === "endgoal") || null;
export const pivotPhases = (adv) => phases(adv).filter((p) => p.kind === "pivot");
export const endGoalRevealed = (adv) => !!endGoalPhase(adv);
export const phaseCount = (adv) => planPhases(adv).length;

// ------------------------------------------------------------------ the Threshold
/** +2 per known phase (Escalation). */
export function endGoalModifier(adv) { return phaseCount(adv) * END_GOAL_ROLL.perPhase; }

/**
 * The d10 face needed for the End Goal on the next reveal, or null when the
 * threshold cannot be reached with one die (the first reveal: 11 > 10).
 */
export function endGoalNeeded(adv) {
  const need = END_GOAL_ROLL.threshold - endGoalModifier(adv);
  if (need > END_GOAL_ROLL.die) return null;   // unreachable this reveal
  return Math.max(1, need);
}

/** Chance in percent that the next reveal is the End Goal. */
export function endGoalChance(adv) {
  const need = endGoalNeeded(adv);
  if (need === null) return 0;
  return Math.round(((END_GOAL_ROLL.die - need + 1) / END_GOAL_ROLL.die) * 100);
}

/**
 * Resolve an End Goal Roll. The Threshold rule, in one place (§9.1a).
 * `d10` is the rolled face; nothing here rolls.
 */
export function endGoalCheck(adv, d10) {
  const modifier = endGoalModifier(adv);
  const total = d10 + modifier;
  const needed = endGoalNeeded(adv);
  return {
    d10, modifier, total,
    threshold: END_GOAL_ROLL.threshold,
    needed,                                  // null when unreachable
    fired: total >= END_GOAL_ROLL.threshold
  };
}

/** The whole threshold ladder, for the rules library and the header tooltip. */
export function endGoalLadder() {
  const rows = [];
  for (let known = 0; known <= 5; known += 1) {
    const modifier = known * END_GOAL_ROLL.perPhase;
    const need = END_GOAL_ROLL.threshold - modifier;
    rows.push({
      reveal: known + 1, known, modifier,
      needed: need > END_GOAL_ROLL.die ? null : Math.max(1, need),
      chance: need > END_GOAL_ROLL.die ? 0 : Math.round(((END_GOAL_ROLL.die - Math.max(1, need) + 1) / END_GOAL_ROLL.die) * 100)
    });
  }
  return rows;
}

// ------------------------------------------------------------------ arcs
export function arcStageKey(adv) { return (adv && adv.arc && adv.arc.stage) || "discovery"; }

/**
 * Can a reveal be earned right now? Reveals belong to the Discovery arc; once the
 * End Goal is out there is nothing left to discover (ruling A1, Once-per-X).
 */
export function canEarnReveal(adv) {
  if (!adv) return { ok: false, reason: "Start an adventure first." };
  if (endGoalRevealed(adv)) {
    return { ok: false, reason: "The End Goal is already known - the Discovery arc is over. Foil the plan, and see the Arc screen for what comes next." };
  }
  if (arcStageKey(adv) !== "discovery") {
    return { ok: false, reason: "Reveals belong to the Discovery arc. This adventure has moved past it." };
  }
  return { ok: true, reason: null };
}

// ------------------------------------------------------------------ the pivot gate
export function pivotEligibility(adv) {
  const flags = (adv && adv.pivotEligible) || {};
  const met = PIVOT_GATE.conditions.filter((c) => !!flags[c.key]);
  return { met, conditions: PIVOT_GATE.conditions, any: met.length > 0, flags };
}

/**
 * May a Pivot Plan be rolled? Gate (survival/underlings/failsafe) plus Once-per-X
 * (one pivot per adventure unless explicitly overridden, ruling A6).
 */
export function canRevealPivot(adv) {
  if (!adv) return { ok: false, reason: "Start an adventure first." };
  const stage = arcStageKey(adv);
  if (stage === "discovery" || stage === "foiling") {
    return { ok: false, reason: "A pivot comes after the plan is defeated. Mark the plan defeated on the Arc screen first." };
  }
  if (pivotPhases(adv).length > 0 && !adv.pivotOverride) {
    return { ok: false, reason: "This adventure already has its Plan B. One pivot per adventure - use the override if you mean to break that deliberately." };
  }
  const { any } = pivotEligibility(adv);
  if (!any) return { ok: false, reason: PIVOT_GATE.refusal };
  const answer = FATE_ANSWERS.find((a) => a.key === adv.fateAnswer);
  if (answer && !answer.pivot) {
    return { ok: false, reason: `You asked the Fate Question and recorded ${answer.label}: the villain does not enact a Plan B. Record a different answer if you asked again.` };
  }
  return { ok: true, reason: null };
}

// ------------------------------------------------------------------ leads
export function leads(adv) {
  return phases(adv).flatMap((p) => (p.leads || []).map((l) => ({ ...l, phaseId: p.id, ordinal: p.ordinal })));
}
export const openLeads = (adv) => leads(adv).filter((l) => !l.resolved);

// ------------------------------------------------------------------ header
/** The numbers that decide what you do next (§6.2 persistent header). */
export function headerStats(adv) {
  if (!adv) return null;
  const needed = endGoalNeeded(adv);
  const revealed = endGoalRevealed(adv);
  return {
    phases: phaseCount(adv),
    endGoalRevealed: revealed,
    needed,
    chance: endGoalChance(adv),
    modifier: endGoalModifier(adv),
    stage: arcStageKey(adv),
    openLeads: openLeads(adv).length,
    pivots: pivotPhases(adv).length
  };
}

/** A one-line answer to "what do I do next?" — every screen can show it (§6.3.7). */
export function nextStep(adv) {
  if (!adv) return { text: "Start an adventure: name the villain and what you already know.", route: "#/new" };
  const stage = arcStageKey(adv);
  if (stage === "discovery") {
    if (phaseCount(adv) === 0) {
      return { text: "Play a scene. When your character has earned it, take the first reveal.", route: "#/reveal" };
    }
    const open = openLeads(adv).length;
    if (open > 0) {
      return { text: `Follow a lead (${open} open), then earn the next reveal.`, route: "#/dossier" };
    }
    return { text: "No open leads. Play toward one, then earn the next reveal.", route: "#/reveal" };
  }
  if (stage === "foiling") return { text: "The plan is known. Go and spoil it, then mark the plan defeated.", route: "#/arc" };
  if (stage === "pivot") {
    if (pivotPhases(adv).length === 0) return { text: "Decide whether the villain gets a Plan B, and roll it now rather than later.", route: "#/arc" };
    return { text: "Play the pivot out - a scene or three - then conclude the adventure.", route: "#/arc" };
  }
  return { text: "This adventure is concluded. Start another, or read this one back.", route: "#/adventures" };
}

// ------------------------------------------------------------------ normalization
export const SCHEMA_VERSION = 1;

/** Back-fill an adventure of any earlier shape. Never throws on old data (§7). */
export function normalizeAdventure(raw) {
  const a = raw && typeof raw === "object" ? { ...raw } : {};
  a.id = a.id || uid("adv");
  a.name = typeof a.name === "string" && a.name.trim() ? a.name : "Untitled adventure";
  a.createdAt = a.createdAt || now();
  a.updatedAt = a.updatedAt || a.createdAt;
  a.archivedAt = a.archivedAt || null;

  const v = a.villain && typeof a.villain === "object" ? a.villain : {};
  a.villain = {
    name: v.name || "",
    epithet: v.epithet || "",
    known: v.known || "",
    forces: v.forces || "",
    behind: v.behind || "",       // the villain behind the villain (End Goal Focus 73-76)
    crafted: normalizeCrafted(v.crafted)   // The Villain Crafter (MM41)
  };

  const arc = a.arc && typeof a.arc === "object" ? a.arc : {};
  const validStage = ARC_STAGES.some((s) => s.key === arc.stage);
  a.arc = {
    stage: validStage ? arc.stage : "discovery",
    endGoalAt: arc.endGoalAt || null,
    defeatedAt: arc.defeatedAt || null,
    pivotAt: arc.pivotAt || null,
    concludedAt: arc.concludedAt || null
  };

  a.phases = (Array.isArray(a.phases) ? a.phases : []).map((p, i) => normalizePhase(p, i));
  // Ordinals are derived, never trusted from storage: two paths must not disagree (§10.12).
  let n = 0;
  for (const p of a.phases) { if (p.kind === "phase") { n += 1; p.ordinal = n; } else p.ordinal = null; }

  const pe = a.pivotEligible && typeof a.pivotEligible === "object" ? a.pivotEligible : {};
  a.pivotEligible = {
    survived: !!pe.survived,
    underlings: !!pe.underlings,
    failsafe: !!pe.failsafe
  };
  // Once-per-X override is a deliberate, per-use permission: it never survives a reload,
  // so it cannot silently stay on (§10.14 — the clearer is normalization itself).
  a.pivotOverride = false;
  a.fateAnswer = a.fateAnswer || null;
  a.record = (Array.isArray(a.record) ? a.record : []).filter((r) => r && r.text);
  return a;
}

function normalizeCrafted(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  const roster = (list) => (Array.isArray(list) ? list : []).filter((u) => u && Array.isArray(u.parts)).map((u) => ({
    ...u,
    id: u.id || uid("und"),
    kind: u.kind === "minion" ? "minion" : "lieutenant",
    name: u.name || "",
    note: u.note || "",
    mod: Number.isFinite(u.mod) ? u.mod : 0
  }));
  return {
    archetype: c.archetype && Array.isArray(c.archetype.parts) ? c.archetype : null,
    organization: c.organization && Array.isArray(c.organization.parts) ? c.organization : null,
    lieutenants: roster(c.lieutenants),
    minions: roster(c.minions)
  };
}

function normalizePhase(raw, i) {
  const p = raw && typeof raw === "object" ? { ...raw } : {};
  p.id = p.id || uid("ph");
  p.kind = ["phase", "endgoal", "pivot"].includes(p.kind) ? p.kind : "phase";
  p.createdAt = p.createdAt || now() + i;
  p.revisedAt = p.revisedAt || null;
  p.earnedNote = p.earnedNote || "";
  p.interpretation = p.interpretation || "";
  p.focus = p.focus && typeof p.focus === "object" ? p.focus : null;
  p.keywords = Array.isArray(p.keywords) ? p.keywords.filter(Boolean) : [];
  p.doubled = !!p.doubled;
  p.check = p.check && typeof p.check === "object" ? p.check : null;
  p.override = !!p.override;
  p.leads = (Array.isArray(p.leads) ? p.leads : []).map((l) => ({
    id: (l && l.id) || uid("lead"),
    text: (l && l.text) || "",
    resolved: !!(l && l.resolved)
  })).filter((l) => l.text);
  return p;
}

// derived.js — everything computed from an adventure. Pure functions plus the
// normalization/migration path. No DOM, no storage.

import { END_GOAL_ROLL, PIVOT_GATE, ARC_STAGES, FATE_ANSWERS } from "../data.js";
import { CHAOS, LISTS, CHAOS_MODES, PROGRESS_TRACK } from "../data-scenes.js";
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

// ------------------------------------------------------------------ scenes & lists
export const chaos = (adv) => (adv ? adv.chaos : CHAOS.start);
export const scenes = (adv) => (adv && Array.isArray(adv.scenes) ? adv.scenes : []);
export const currentScene = (adv) => scenes(adv).find((sc) => !sc.endedAt) || null;
export const sceneCount = (adv) => scenes(adv).length;

export const chaosMode = (adv) => (adv && adv.chaosMode) || "standard";
export const resolutionMode = (adv) => (adv && adv.resolution) || "chart";
export const track = (adv) => (adv && adv.track) || null;
export function focusThread(adv) {
  const t = track(adv);
  if (!t) return null;
  return listItems(adv, "threads").find((item) => item.id === t.threadId) || null;
}
export const trackComplete = (adv) => { const t = track(adv); return !!t && t.points >= t.length; };

/**
 * The track in phases of five points, each asking the book's question: did a flashpoint
 * happen in it? Replaying the awards in order is what answers that - a flashpoint counts
 * for the phase the running total was in when it was scored.
 */
export function trackPhases(adv) {
  const t = track(adv);
  if (!t) return [];
  const size = PROGRESS_TRACK.phaseSize;
  const count = Math.ceil(t.length / size);
  const phases = Array.from({ length: count }, (_, i) => ({
    index: i, from: i * size + 1, to: Math.min(t.length, (i + 1) * size),
    flashpoint: false, complete: t.points >= Math.min(t.length, (i + 1) * size)
  }));
  let running = 0;
  for (const award of t.awards) {
    // the phase a score lands in is the one holding the point it started from
    const phase = phases[Math.min(count - 1, Math.floor(running / size))];
    if (phase && award.kind === "flashpoint") phase.flashpoint = true;
    running += award.points;
  }
  return phases;
}

/**
 * A phase that is finished and never had a flashpoint: the track owes you one. The book
 * triggers it at the moment the threshold is crossed, so this reads the earliest such
 * phase rather than all of them.
 */
export function owedFlashpoint(adv) {
  return trackPhases(adv).find((p) => p.complete && !p.flashpoint) || null;
}
/** Plot armour: the focus thread cannot be resolved until the track is full. */
export function plotArmoured(adv, threadId) {
  const t = track(adv);
  return !!t && t.threadId === threadId && !trackComplete(adv);
}

export function listItems(adv, kind) {
  const list = (adv && adv[kind === "characters" ? "characters" : "threads"]) || [];
  return list.filter((item) => !item.removed);
}
/** Lines used: the weighting is entries, and the sheet holds twenty-five of them. */
export function listLines(adv, kind) {
  return listItems(adv, kind).reduce((sum, item) => sum + item.entries, 0);
}
export function listFull(adv, kind) { return listLines(adv, kind) >= LISTS.lines; }
export function listNeedsCleanup(adv, kind) {
  return listFull(adv, kind) && listItems(adv, kind).some((item) => item.entries > LISTS.cleanupTo);
}

// ------------------------------------------------------------------ header
/** The numbers that decide what you do next (§6.2 persistent header). */
export function headerStats(adv) {
  if (!adv) return null;
  const needed = endGoalNeeded(adv);
  const revealed = endGoalRevealed(adv);
  return {
    chaos: chaos(adv),
    scene: currentScene(adv),
    phases: phaseCount(adv),
    endGoalRevealed: revealed,
    needed,
    chance: endGoalChance(adv),
    modifier: endGoalModifier(adv),
    stage: arcStageKey(adv),
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
    details: normalizeDetails(v.details),  // Elements meaning-table rolls (GME2e)
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

  // Scenes, the Chaos Factor and the two lists (GME2e).
  const storedChaos = Number(a.chaos);
  a.chaos = Number.isFinite(storedChaos)
    ? Math.min(CHAOS.max, Math.max(CHAOS.min, Math.round(storedChaos)))
    : CHAOS.start;
  a.resolution = ["chart", "check"].includes(a.resolution) ? a.resolution : "chart";
  a.chaosMode = CHAOS_MODES.some((m) => m.key === a.chaosMode) ? a.chaosMode : "standard";
  // Mid-Chaos is a Fate Check rule here; on the chart it falls back to standard (A32).
  // Mid-Chaos was Check-only while its chart was unsupplied; the page arrived, so every
  // mode now works on both resolutions and nothing is forced back to standard.
  a.threads = normalizeList(a.threads);
  a.characters = normalizeList(a.characters);
  a.track = normalizeTrack(a.track, a.threads);
  a.scenes = (Array.isArray(a.scenes) ? a.scenes : [])
    .filter((sc) => sc && sc.test)
    .map((sc, i) => ({
      id: sc.id || uid("scene"),
      n: i + 1,
      test: sc.test,
      expectation: sc.expectation || "",
      notes: sc.notes || "",
      adjustments: Array.isArray(sc.adjustments) ? sc.adjustments.filter(Boolean) : [],
      event: sc.event && sc.event.focus ? sc.event : null,
      words: Array.isArray(sc.words) ? sc.words.filter(Boolean) : [],
      control: ["in", "out", "random"].includes(sc.control) ? sc.control : null,
      // an Exceptional No on a Discovery Check shuts Discovery for the rest of the scene
      discoveryClosed: sc.discoveryClosed === true,
      startedAt: sc.startedAt || now(),
      endedAt: sc.endedAt || null
    }));
  return a;
}

/** The Thread Progress Track, if one is running, pinned to a live thread. */
function normalizeTrack(raw, threads) {
  if (!raw || !raw.threadId) return null;
  if (!threads.some((t) => t.id === raw.threadId && !t.removed)) return null;
  const length = PROGRESS_TRACK.lengths.includes(raw.length) ? raw.length : PROGRESS_TRACK.lengths[0];
  return {
    threadId: raw.threadId,
    length,
    points: Math.min(length, Math.max(0, Math.round(Number(raw.points)) || 0)),
    awards: (Array.isArray(raw.awards) ? raw.awards : []).filter((a) => a && a.key).map((a) => ({
      key: a.key, label: a.label || a.key, points: Number(a.points) || 0,
      // `kind` is what the book counts: only a flashpoint satisfies a phase. Older
      // records predate the field, so fall back to the key, which was the kind then.
      kind: a.kind || a.key,
      note: a.note || "", at: a.at || now()
    })),
    concluded: !!raw.concluded,
    conclusion: raw.conclusion && raw.conclusion.focus ? raw.conclusion : null,
    // the untested scene the conclusion guarantees is a one-use thing
    conclusionPlayed: raw.conclusionPlayed === true,
    // A phase flashpoint the track owes you, when bookkeeping crossed the threshold: the
    // book says it lands at the start of the next scene, not retroactively in the last.
    pendingFlashpoint: raw.pendingFlashpoint === true,
    flashpoint: raw.flashpoint && raw.flashpoint.focus ? raw.flashpoint : null
  };
}

function normalizeList(list) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && item.text)
    .map((item) => ({
      id: item.id || uid("li"),
      text: String(item.text),
      entries: Math.min(LISTS.maxEntries, Math.max(1, Math.round(Number.isFinite(Number(item.entries)) ? Number(item.entries) : 1))),
      removed: !!item.removed,
      createdAt: item.createdAt || now()
    }));
}

function normalizeDetails(list) {
  return (Array.isArray(list) ? list : [])
    .filter((d) => d && d.word)
    .map((d) => ({ id: d.id || uid("det"), tableId: d.tableId || "", table: d.table || "", roll: d.roll || 0, word: d.word, at: d.at || now() }));
}

function normalizeCrafted(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  const roster = (list) => (Array.isArray(list) ? list : []).filter((u) => u && Array.isArray(u.parts)).map((u) => ({
    ...u,
    id: u.id || uid("und"),
    kind: u.kind === "minion" ? "minion" : "lieutenant",
    name: u.name || "",
    note: u.note || "",
    mod: Number.isFinite(u.mod) ? u.mod : 0,
    details: normalizeDetails(u.details)
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

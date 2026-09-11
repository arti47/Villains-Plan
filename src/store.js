// store.js — persistence, the adventure list, the roll log, export/import and undo.
// Storage is plain JSON in localStorage; nothing is sent anywhere (§5.1).

import { APP, uid, now, deepClone } from "./core.js";
import { LOG_CAP } from "../data.js";
import { SCHEMA_VERSION, normalizeAdventure } from "./derived.js";

const KEY = APP.storeKey;

const EMPTY = () => ({
  version: SCHEMA_VERSION,
  activeAdventureId: null,
  adventures: [],
  rollLog: [],
  migrations: []
});

let state = null;
let undoSlot = null;              // one-step undo (§6.4); label + snapshot
const listeners = new Set();

// ------------------------------------------------------------------ load / save
export function load() {
  if (state) return state;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { raw = null; }
  state = normalizeState(raw);
  return state;
}

/** Migration path: back-fills any earlier shape, and reports what it repaired (§14.1.9). */
function normalizeState(raw) {
  const repairs = [];
  const s = EMPTY();
  if (!raw || typeof raw !== "object") return s;

  if (raw.version !== SCHEMA_VERSION) repairs.push(`version ${raw.version ?? "absent"} read as ${SCHEMA_VERSION}`);

  // A pre-list shape: one adventure stored at the top level.
  const list = Array.isArray(raw.adventures) ? raw.adventures
    : (raw.adventure ? [raw.adventure] : []);
  if (!Array.isArray(raw.adventures) && raw.adventure) repairs.push("single adventure moved into the adventure list");

  s.adventures = list.map((a) => {
    const before = JSON.stringify(a);
    const after = normalizeAdventure(a);
    if (JSON.stringify(after) !== before) repairs.push(`adventure "${after.name}" back-filled`);
    return after;
  });

  s.rollLog = (Array.isArray(raw.rollLog) ? raw.rollLog : []).filter((r) => r && r.id).slice(0, LOG_CAP);
  const ids = new Set(s.adventures.map((a) => a.id));
  s.activeAdventureId = ids.has(raw.activeAdventureId) ? raw.activeAdventureId
    : (s.adventures[0] ? s.adventures[0].id : null);
  if (raw.activeAdventureId && !ids.has(raw.activeAdventureId)) repairs.push("active adventure pointed at a missing record; reset");
  s.migrations = repairs;
  return s;
}

function save() {
  const s = load();
  s.version = SCHEMA_VERSION;
  try { localStorage.setItem(KEY, JSON.stringify(s)); }
  catch (err) { console.warn("Schemer: could not write to localStorage", err); }
  for (const fn of listeners) fn(s);
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function migrationReport() { return load().migrations.slice(); }

/** Re-run normalization over what is stored and report the repairs (§14.1.9). */
export function checkIntegrity() {
  const raw = deepClone(load());
  state = normalizeState(raw);
  save();
  return state.migrations.slice();
}

// ------------------------------------------------------------------ undo (one step)
export function snapshot(label) {
  undoSlot = { label, at: now(), data: deepClone(load()) };
}
export function undoAvailable() { return undoSlot ? { label: undoSlot.label, at: undoSlot.at } : null; }
export function undo() {
  if (!undoSlot) return null;
  const { label } = undoSlot;
  state = normalizeState(undoSlot.data);
  undoSlot = null;
  save();
  return label;
}
export function clearUndo() { undoSlot = null; }

// ------------------------------------------------------------------ adventures
export function adventures() { return load().adventures.slice(); }
export function activeId() { return load().activeAdventureId; }
export function active() {
  const s = load();
  return s.adventures.find((a) => a.id === s.activeAdventureId) || null;
}
export function adventure(id) { return load().adventures.find((a) => a.id === id) || null; }

export function setActive(id) {
  const s = load();
  if (!s.adventures.some((a) => a.id === id)) return null;
  s.activeAdventureId = id;
  save();
  return active();
}

export function createAdventure(fields = {}) {
  const s = load();
  const adv = normalizeAdventure({
    id: uid("adv"),
    name: fields.name,
    createdAt: now(),
    villain: {
      name: fields.villainName || "",
      epithet: fields.epithet || "",
      known: fields.known || "",
      forces: fields.forces || ""
    }
  });
  s.adventures.unshift(adv);
  s.activeAdventureId = adv.id;
  record(adv.id, "start", `Adventure started${adv.villain.name ? ` against ${adv.villain.name}` : ""}.`);
  save();
  return adv;
}

export function updateAdventure(id, patch) {
  const adv = adventure(id);
  if (!adv) return null;
  Object.assign(adv, patch, { updatedAt: now() });
  const fixed = normalizeAdventure(adv);
  replaceAdventure(fixed);
  save();
  return fixed;
}

export function updateVillain(id, patch) {
  const adv = adventure(id);
  if (!adv) return null;
  adv.villain = { ...adv.villain, ...patch };
  adv.updatedAt = now();
  save();
  return adv;
}

function replaceAdventure(adv) {
  const s = load();
  const i = s.adventures.findIndex((a) => a.id === adv.id);
  if (i >= 0) s.adventures[i] = adv;
}

export function deleteAdventure(id) {
  const s = load();
  const adv = adventure(id);
  if (!adv) return null;
  snapshot(`deleting "${adv.name}"`);
  s.adventures = s.adventures.filter((a) => a.id !== id);
  s.rollLog = s.rollLog.filter((r) => r.adventureId !== id);
  if (s.activeAdventureId === id) s.activeAdventureId = s.adventures[0] ? s.adventures[0].id : null;
  save();
  return adv;
}

// ------------------------------------------------------------------ the crafted villain
export function setCrafted(advId, patch) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.villain.crafted = { ...adv.villain.crafted, ...patch };
  adv.updatedAt = now();
  save();
  return adv.villain.crafted;
}

export function addUnderling(advId, kind, entry) {
  const adv = adventure(advId);
  if (!adv || !entry) return null;
  const list = kind === "minion" ? "minions" : "lieutenants";
  adv.villain.crafted[list] = [...(adv.villain.crafted[list] || []), { ...entry, kind }];
  adv.updatedAt = now();
  save();
  return entry;
}

export function updateUnderling(advId, kind, id, patch) {
  const adv = adventure(advId);
  if (!adv) return null;
  const list = kind === "minion" ? "minions" : "lieutenants";
  const entry = (adv.villain.crafted[list] || []).find((u) => u.id === id);
  if (!entry) return null;
  Object.assign(entry, patch);
  adv.updatedAt = now();
  save();
  return entry;
}

export function removeUnderling(advId, kind, id) {
  const adv = adventure(advId);
  if (!adv) return null;
  const list = kind === "minion" ? "minions" : "lieutenants";
  adv.villain.crafted[list] = (adv.villain.crafted[list] || []).filter((u) => u.id !== id);
  adv.updatedAt = now();
  save();
  return adv.villain.crafted[list];
}

// ------------------------------------------------------------------ scenes, chaos, lists
export function addScene(advId, scene) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.scenes = [...(adv.scenes || []), scene];
  adv.updatedAt = now();
  save();
  return adv.scenes[adv.scenes.length - 1];
}

export function updateScene(advId, sceneId, patch) {
  const adv = adventure(advId);
  const scene = adv && (adv.scenes || []).find((sc) => sc.id === sceneId);
  if (!scene) return null;
  Object.assign(scene, patch);
  adv.updatedAt = now();
  save();
  return scene;
}

export function setResolution(advId, mode) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.resolution = mode;
  adv.updatedAt = now();
  save();
  return adv.resolution;
}

export function setChaosMode(advId, mode) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.chaosMode = mode;
  adv.updatedAt = now();
  save();
  return adv.chaosMode;
}

export function setTrack(advId, patch) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.track = patch ? { ...(adv.track || {}), ...patch } : null;
  adv.updatedAt = now();
  save();
  return adv.track;
}

export function awardTrack(advId, award) {
  const adv = adventure(advId);
  if (!adv || !adv.track) return null;
  const next = Math.min(adv.track.length, adv.track.points + award.points);
  adv.track = { ...adv.track, points: next, awards: [...(adv.track.awards || []), { ...award, at: now() }] };
  adv.updatedAt = now();
  save();
  return adv.track;
}

export function setChaos(advId, value) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.chaos = value;
  adv.updatedAt = now();
  save();
  return adv.chaos;
}

function listKey(kind) { return kind === "characters" ? "characters" : "threads"; }

export function addListItem(advId, kind, text) {
  const adv = adventure(advId);
  if (!adv || !String(text || "").trim()) return null;
  const key = listKey(kind);
  const item = { id: uid("li"), text: String(text).trim(), entries: 1, removed: false, createdAt: now() };
  adv[key] = [...(adv[key] || []), item];
  adv.updatedAt = now();
  save();
  return item;
}

export function setListEntries(advId, kind, itemId, entries) {
  const adv = adventure(advId);
  const item = adv && (adv[listKey(kind)] || []).find((i) => i.id === itemId);
  if (!item) return null;
  item.entries = entries;
  adv.updatedAt = now();
  save();
  return item;
}

/** Crossing out removes every line the element held (GME2e, via summary). */
export function removeListItem(advId, kind, itemId) {
  const adv = adventure(advId);
  const item = adv && (adv[listKey(kind)] || []).find((i) => i.id === itemId);
  if (!item) return null;
  item.removed = true;
  adv.updatedAt = now();
  save();
  return item;
}

/**
 * The clean-up transfer. Every live element is copied with a single entry, except ones
 * holding three, which come across with two (GME2e, quoted). Crossed-out elements do not
 * travel. `entriesFor` is the mapping from the data file, so the rule is not inlined here.
 */
export function cleanupList(advId, kind, entriesFor) {
  const adv = adventure(advId);
  if (!adv) return null;
  const key = listKey(kind);
  snapshot(`cleaning up the ${kind} list`);
  const live = (adv[key] || []).filter((item) => !item.removed);
  let reduced = 0;
  adv[key] = live.map((item) => {
    const entries = entriesFor[item.entries] || 1;
    if (entries < item.entries) reduced += 1;
    return { ...item, entries };
  });
  adv.updatedAt = now();
  save();
  return { carried: adv[key].length, reduced, lines: adv[key].reduce((n, i) => n + i.entries, 0) };
}

// ------------------------------------------------------------------ villain details
function detailHolder(adv, target) {
  if (!target || target.kind === "villain") return adv.villain;
  const list = target.kind === "minion" ? "minions" : "lieutenants";
  return (adv.villain.crafted[list] || []).find((u) => u.id === target.id) || null;
}

export function addDetail(advId, target, entry) {
  const adv = adventure(advId);
  const holder = adv && detailHolder(adv, target);
  if (!holder || !entry) return null;
  holder.details = [...(holder.details || []), { id: uid("det"), ...entry }];
  adv.updatedAt = now();
  save();
  return holder.details[holder.details.length - 1];
}

export function removeDetail(advId, target, detailId) {
  const adv = adventure(advId);
  const holder = adv && detailHolder(adv, target);
  if (!holder) return null;
  holder.details = (holder.details || []).filter((d) => d.id !== detailId);
  adv.updatedAt = now();
  save();
  return holder.details;
}

// ------------------------------------------------------------------ phases
export function addPhase(advId, phase) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.phases.push(phase);
  adv.updatedAt = now();
  replaceAdventure(normalizeAdventure(adv));
  save();
  const saved = adventure(advId);
  return saved.phases.find((p) => p.id === phase.id) || null;
}

export function updatePhase(advId, phaseId, patch) {
  const adv = adventure(advId);
  if (!adv) return null;
  const phase = adv.phases.find((p) => p.id === phaseId);
  if (!phase) return null;
  Object.assign(phase, patch, { revisedAt: now() });
  adv.updatedAt = now();
  save();
  return phase;
}

export function deletePhase(advId, phaseId) {
  const adv = adventure(advId);
  if (!adv) return null;
  const phase = adv.phases.find((p) => p.id === phaseId);
  if (!phase) return null;
  snapshot(`deleting reveal ${phase.ordinal || phase.kind}`);
  adv.phases = adv.phases.filter((p) => p.id !== phaseId);
  // Deleting the End Goal reopens the Discovery arc: the stage is state, not history.
  if (phase.kind === "endgoal") { adv.arc.stage = "discovery"; adv.arc.endGoalAt = null; }
  adv.updatedAt = now();
  replaceAdventure(normalizeAdventure(adv));
  save();
  return phase;
}

// ------------------------------------------------------------------ leads
export function addLead(advId, phaseId, text) {
  const adv = adventure(advId);
  const phase = adv && adv.phases.find((p) => p.id === phaseId);
  if (!phase || !String(text || "").trim()) return null;
  const lead = { id: uid("lead"), text: String(text).trim(), resolved: false };
  phase.leads.push(lead);
  adv.updatedAt = now();
  save();
  return lead;
}
export function toggleLead(advId, phaseId, leadId) {
  const adv = adventure(advId);
  const phase = adv && adv.phases.find((p) => p.id === phaseId);
  const lead = phase && phase.leads.find((l) => l.id === leadId);
  if (!lead) return null;
  lead.resolved = !lead.resolved;
  adv.updatedAt = now();
  save();
  return lead;
}
export function deleteLead(advId, phaseId, leadId) {
  const adv = adventure(advId);
  const phase = adv && adv.phases.find((p) => p.id === phaseId);
  if (!phase) return null;
  phase.leads = phase.leads.filter((l) => l.id !== leadId);
  adv.updatedAt = now();
  save();
  return phase;
}

// ------------------------------------------------------------------ arc & pivot state
export function setArcStage(advId, stage, stamps = {}) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.arc = { ...adv.arc, stage, ...stamps };
  adv.updatedAt = now();
  save();
  return adv;
}
export function setPivotFlag(advId, key, value) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.pivotEligible = { ...adv.pivotEligible, [key]: !!value };
  adv.updatedAt = now();
  save();
  return adv;
}
export function setPivotOverride(advId, value) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.pivotOverride = !!value;   // cleared by normalization on reload (§10.14)
  save();
  return adv;
}
export function setFateAnswer(advId, answer) {
  const adv = adventure(advId);
  if (!adv) return null;
  adv.fateAnswer = answer || null;
  adv.updatedAt = now();
  save();
  return adv;
}

// ------------------------------------------------------------------ session record
export function record(advId, kind, text) {
  const adv = adventure(advId);
  if (!adv) return null;
  const entry = { ts: now(), kind, text };
  adv.record.push(entry);
  save();
  return entry;
}
export function sessionRecord(advId) {
  const adv = adventure(advId);
  return adv ? adv.record.slice().reverse() : [];
}

// ------------------------------------------------------------------ roll log
export function pushLog(entry) {
  const s = load();
  const row = { id: uid("log"), ts: now(), ...entry };
  s.rollLog.unshift(row);
  if (s.rollLog.length > LOG_CAP) s.rollLog.length = LOG_CAP;
  save();
  return row;
}
export function rollLog(filter = {}) {
  const s = load();
  let rows = s.rollLog.slice();
  if (filter.adventureId) rows = rows.filter((r) => r.adventureId === filter.adventureId);
  if (filter.kind) rows = rows.filter((r) => r.kind === filter.kind);
  return rows;
}
export function clearLog() {
  const s = load();
  snapshot(`clearing the roll log (${s.rollLog.length} entries)`);
  s.rollLog = [];
  save();
}

/** Per-face counts, the fairness answer (§5.1, §14.1.10). */
export function logDistribution(filter = {}) {
  const rows = rollLog(filter);
  const d10 = Array.from({ length: 10 }, () => 0);
  const d100Deciles = Array.from({ length: 10 }, () => 0);
  let d10Total = 0; let d100Total = 0;
  for (const row of rows) {
    for (const die of row.dice || []) {
      if (die.die === "d10" && die.value >= 1 && die.value <= 10) { d10[die.value - 1] += 1; d10Total += 1; }
      if (die.die === "d100" && die.value >= 1 && die.value <= 100) {
        d100Deciles[Math.floor((die.value - 1) / 10)] += 1; d100Total += 1;
      }
    }
  }
  return { d10, d10Total, d100Deciles, d100Total, rolls: rows.length };
}

// ------------------------------------------------------------------ export / import
export function exportJSON() {
  const s = load();
  return JSON.stringify({
    app: APP.name, schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
    activeAdventureId: s.activeAdventureId, adventures: s.adventures, rollLog: s.rollLog
  }, null, 2);
}

export function exportFilename() {
  const stamp = new Date().toISOString().slice(0, 10);
  return `schemer-backup-${stamp}.json`;
}

/** Replaces everything. Snapshots first, so an import is undoable (§10.18). */
export function importJSON(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { return { ok: false, error: "That file is not valid JSON." }; }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "That file does not contain a Schemer backup." };
  const list = Array.isArray(parsed.adventures) ? parsed.adventures : (parsed.adventure ? [parsed.adventure] : null);
  if (!list) return { ok: false, error: "No adventures found in that file." };
  snapshot("importing a backup");
  state = normalizeState({
    version: parsed.schema, adventures: list,
    rollLog: parsed.rollLog, activeAdventureId: parsed.activeAdventureId
  });
  save();
  return { ok: true, adventures: state.adventures.length, repairs: state.migrations.slice() };
}

/** A rendered, human-readable dossier — the export a player can print or hand over (§14.1.7). */
export function exportText(advId) {
  const adv = adventure(advId);
  if (!adv) return "";
  const lines = [];
  lines.push(adv.name, "=".repeat(adv.name.length), "");
  if (adv.villain.name) lines.push(`Villain: ${adv.villain.name}${adv.villain.epithet ? `, ${adv.villain.epithet}` : ""}`);
  lines.push(`Arc: ${adv.arc.stage}`, "");
  if (adv.villain.known) lines.push("What was known at the start:", adv.villain.known, "");
  for (const p of adv.phases) {
    const head = p.kind === "endgoal" ? "END GOAL" : p.kind === "pivot" ? "PIVOT PLAN" : `PHASE ${p.ordinal}`;
    lines.push(head);
    if (p.check) lines.push(`  End Goal Roll: d10 ${p.check.d10} + ${p.check.modifier} = ${p.check.total}${p.check.needed ? ` (needed ${p.check.needed}+)` : " (out of reach)"}`);
    if (p.focus) lines.push(`  ${p.focus.tableName} ${p.focus.roll}: ${p.focus.label}`);
    if (p.keywords.length) lines.push(`  Keywords: ${p.keywords.map((k) => `${k.word} (${k.roll})`).join(", ")}${p.doubled ? " - doubled" : ""}`);
    if (p.interpretation) lines.push(`  ${p.interpretation}`);
    for (const l of p.leads) lines.push(`  Lead${l.resolved ? " (resolved)" : ""}: ${l.text}`);
    lines.push("");
  }
  return lines.join("\n");
}

/** Test seam: load a fixture state without touching localStorage. */
export function __setState(raw) { state = normalizeState(raw); return state; }

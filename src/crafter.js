// crafter.js — The Villain Crafter (MM41): archetype, organization, lieutenants and
// minions, with the modifiers carried between them. The cascades here (Double
// Archetypes, Upscale, Teamwork) are explicit loops with their own termination, because
// a rule that says "roll again" is the shape most often shipped as a single shot.

import { el, add, d100 as rollD100, uid, now, formatDate } from "./core.js";
import {
  explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast, confirmModal,
  inlineRow
} from "./ui.js";
import {
  archetypeTable, organizationTable, underlingTable, crafterGuidance, crafterSource,
  lookupOpen, SPECIAL_KEYS, villainDetailTables, meaningTables, meaningTable
} from "./rules.js";
import { discover } from "./oracle.js";
import * as store from "./store.js";
import { Settings } from "./settings.js";
import { refresh } from "./router.js";

const REROLL_CAP = 50;   // a guard on the re-roll loop, not a rule
const DEPTH_CAP = 4;     // the nesting the rules allow is 2; this is the guard

function meaningWord() {
  // The tables say "roll on Mythic's Action meaning table" - which this app has, from
  // One-Page Mythic - so the result is a real word rather than an instruction (A17).
  return Settings.mythicOracle() ? discover("action", { logAs: "crafter" }) : null;
}

function entryFor(row, kind) {
  const entry = {
    key: row.key, label: row.label, text: row.text, special: row.special || null,
    mods: row.mods ? { ...row.mods } : null
  };
  if (kind === "minion" && row.minion) {
    return { ...entry, key: row.minion.key, label: row.minion.label, text: row.minion.text };
  }
  return entry;
}

/**
 * Draw one row, re-rolling any result in `banned`. This is what "ignore it and re-roll"
 * means, and it is why the cascades terminate: a nested Double is never expanded.
 */
function draw(table, mod, kind, banned, rolls) {
  for (let i = 0; i < REROLL_CAP; i += 1) {
    const roll = rollD100();
    const total = roll + mod;
    const row = lookupOpen(table, total);
    if (banned.includes(row.special) || banned.includes(row.key)) continue;
    rolls.push(mod ? { roll, mod, total } : roll);
    return entryFor(row, kind);
  }
  throw new Error(`${table.name}: could not draw a result that was not re-rolled`);
}

/**
 * Draw and follow whatever the result tells you to do next.
 * Double Archetypes draws two, each re-rolling further Doubles (MM41: "if you roll
 * Double Archetypes again, ignore it and re-roll"). Upscale draws once more, re-rolling
 * both Upscale and Double. Neither can recur, so neither can run away.
 */
function expand(table, mod, kind, banned, rolls, words, depth = 0) {
  const entry = draw(table, mod, kind, banned, rolls);

  if (entry.special === SPECIAL_KEYS.double && depth < DEPTH_CAP) {
    const inner = [...banned, SPECIAL_KEYS.double];
    return [
      ...expand(table, mod, kind, inner, rolls, words, depth + 1),
      ...expand(table, mod, kind, inner, rolls, words, depth + 1)
    ];
  }

  if (entry.special === SPECIAL_KEYS.upscale && depth < DEPTH_CAP) {
    const inner = [...banned, SPECIAL_KEYS.upscale, SPECIAL_KEYS.double];
    return [
      { ...entry, scaffold: true },
      ...expand(table, mod, kind, inner, rolls, words, depth + 1)
    ];
  }

  if (entry.special === "teamwork" && depth < DEPTH_CAP) {
    // Rolled again inside a Teamwork, Teamwork reads As Expected (MM41:p15).
    const inner = [...banned, SPECIAL_KEYS.double];
    const partner = expand(table, mod, kind, [...inner, "teamwork"], rolls, words, depth + 1);
    return [entry, ...partner];
  }

  if (entry.special === SPECIAL_KEYS.meaning) {
    const word = meaningWord();
    if (word) words.push(word);
    return [{ ...entry, word: word ? word.word : null }];
  }

  return [entry];
}

function sumMods(parts, keys) {
  return keys.reduce((acc, key) => {
    acc[key] = parts.reduce((sum, part) => sum + (part.mods ? part.mods[key] || 0 : 0), 0);
    return acc;
  }, {});
}

/** Roll one archetype, following Double Archetypes and Meaning Table where they lead. */
export function rollArchetype() {
  const rolls = []; const words = [];
  const parts = expand(archetypeTable(), 0, null, [], rolls, words);
  const result = { id: uid("arch"), at: now(), rolls, parts, words, mods: sumMods(parts, ["o", "l", "m"]), note: "" };
  logCrafter("archetype", rolls, parts, words);
  return result;
}

/** Roll the organization at the archetype's o modifier, following Upscale and Double. */
export function rollOrganization(oMod = 0) {
  const rolls = []; const words = [];
  const parts = expand(organizationTable(), oMod, null, [], rolls, words);
  const result = {
    id: uid("org"), at: now(), rolls, parts, words,
    mods: sumMods(parts, ["l", "m"]),
    upscaled: parts.filter((p) => p.scaffold).length,
    oMod, note: ""
  };
  logCrafter("organization", rolls, parts, words);
  return result;
}

/** Roll one lieutenant or minion at the accumulated modifier. */
export function rollUnderling(kind, mod = 0) {
  const rolls = []; const words = [];
  const parts = expand(underlingTable(), mod, kind, [], rolls, words);
  const result = {
    id: uid("und"), at: now(), kind, rolls, parts, words,
    teamwork: parts.some((p) => p.special === "teamwork"),
    mod, name: "", note: ""
  };
  logCrafter(kind, rolls, parts, words);
  return result;
}

function logCrafter(what, rolls, parts, words) {
  const adv = store.active();
  const dice = rolls.map((entry) => ({
    die: "d100",
    value: typeof entry === "number" ? entry : entry.roll,
    table: `Villain Crafter - ${what}`
  }));
  for (const word of words) dice.push({ die: "d100", value: word.roll, table: "Discover Meaning - Action" });
  store.pushLog({
    adventureId: adv ? adv.id : null,
    kind: "crafter",
    summary: parts.map((p) => p.label).join(" + ") + (words.length ? ` (${words.map((w) => w.word).join(", ")})` : ""),
    dice,
    outcome: `${what}: ${parts.filter((p) => !p.scaffold).map((p) => p.label).join(" + ")}`
  });
  if (adv) store.record(adv.id, "crafter", `Villain Crafter - ${what}: ${parts.map((p) => p.label).join(" + ")}.`);
}

// ------------------------------------------------------------------ derived
export function crafted(adv) {
  const c = adv && adv.villain && adv.villain.crafted;
  return c || { archetype: null, organization: null, lieutenants: [], minions: [] };
}

/** The modifier arithmetic, shown rather than asserted (A16). */
export function modifierBreakdown(adv) {
  const c = crafted(adv);
  const arch = c.archetype ? c.archetype.mods : { o: 0, l: 0, m: 0 };
  const org = c.organization ? c.organization.mods : { l: 0, m: 0 };
  return {
    organization: { archetype: arch.o, total: arch.o },
    lieutenant: { archetype: arch.l, organization: org.l, total: arch.l + org.l },
    minion: { archetype: arch.m, organization: org.m, total: arch.m + org.m },
    hasArchetype: !!c.archetype,
    hasOrganization: !!c.organization
  };
}

/** The organization roll takes the archetype's modifier, so the archetype comes first. */
export function canRollOrganization(adv) {
  if (!adv) return { ok: false, reason: "Start an adventure first." };
  if (!crafted(adv).archetype) {
    return { ok: false, reason: "The organization roll carries the archetype's modifier, so roll the archetype first." };
  }
  return { ok: true, reason: null };
}

export function canRollUnderling(adv) {
  if (!adv) return { ok: false, reason: "Start an adventure first." };
  if (!crafted(adv).archetype) {
    return { ok: false, reason: "Lieutenants and minions carry modifiers from the archetype and the organization. Roll the archetype first." };
  }
  return { ok: true, reason: null };
}

// ------------------------------------------------------------------ screen
const ROSTER_PAGE = 4;    // a roster grows without bound otherwise (§6.5)
/**
 * Which meaning tables the details step rolls on. Several can be picked at once and
 * rolled in one press - an interface convenience, NOT a house rule (§2.2): each table is
 * still its own d100 on its own table, stored and logged separately, exactly as rolling
 * them one at a time would. Nothing is combined and no table is invented.
 */
let detailTableIds = new Set(["character-identity"]);

/**
 * Which folds the reader has opened. Every control re-renders the screen, and a fold
 * that comes back closed after a press inside it is a fold that snaps shut on the
 * reader's hand - the details picker did exactly that on every table chip (F57).
 */
const foldOpen = {};
function rememberedFold(key, node, defaultOpen) {
  node.open = key in foldOpen ? foldOpen[key] : defaultOpen;
  node.addEventListener("toggle", () => { foldOpen[key] = node.open; });
  return node;
}

const selectedTables = () => meaningTables().filter((t) => detailTableIds.has(t.id));

function toggleDetailTable(id) {
  if (detailTableIds.has(id)) detailTableIds.delete(id);
  else detailTableIds.add(id);
  // never leave the step with nothing to roll
  if (!detailTableIds.size) detailTableIds.add(id);
}

/** "Identity" · "Identity + Skills" · "4 tables", so the button says what it will do. */
function selectionLabel() {
  const picked = selectedTables();
  if (picked.length === 1) return picked[0].short;
  if (picked.length === 2) return `${picked[0].short} + ${picked[1].short}`;
  return `${picked.length} tables`;
}
let underlingKind = "lieutenant";
const rosterPage = { lieutenant: 1, minion: 1 };

export function renderVillain() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Craft the villain" }),
    explain("The Villain Crafter: an archetype for who the villain is, a shape for the organization behind them, and archetypes for the lieutenants and minions your character will actually meet. Each roll carries a modifier into the next, and the app shows that arithmetic. Roll it all up front for a running start, or take each piece when your character learns it."));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }

  const c = crafted(adv);
  const mods = modifierBreakdown(adv);

  add(content, guidanceNote(crafterGuidance("stages"), "crafter-stages"));
  add(content, archetypeCard(adv, c, mods));
  add(content, detailsCard(adv));
  add(content, organizationCard(adv, c, mods));
  add(content, underlingsCard(adv, c, mods));
  add(content, guidanceNote(crafterGuidance("interpret"), "crafter-interpret"),
    guidanceNote(crafterGuidance("stats"), "crafter-stats"));

  const action = c.archetype
    ? actionBar({
      label: `Roll a ${underlingKind}`,
      context: `modifier ${signed(underlingKind === "lieutenant" ? mods.lieutenant.total : mods.minion.total)}`,
      onClick: () => rollUnderlingInto(adv)
    })
    : actionBar({
      label: "Roll the archetype",
      context: "Step 1 of 4 · who the villain is",
      onClick: () => rollArchetypeInto(adv)
    });
  return { content, action };
}

function signed(n) { return n >= 0 ? `+${n}` : String(n); }

/**
 * Step 4: the details. The Crafter says the archetype paints the general picture and
 * sends you to Mythic's Elements meaning tables for who the villain actually is
 * (MM41:p5). Those tables are in the app now, so this is a control rather than a
 * sentence - and it is the same roll and the same log row as the oracle's.
 */
function detailsCard(adv) {
  const box = el("section", { class: "card crafter-card" });
  add(box, el("h2", { class: "card-title" }, "2 · The details", citeLink("villain-details", "rule")),
    el("p", { class: "block-note", text: "Who they actually are: identity, skills, what drives them, how they think, what they look like, their quirks and where they came from. Roll a word and read it against everything above." }));

  const details = adv.villain.details || [];
  // the picker is the tallest thing on the card; once there are details it folds
  const pickerFold = rememberedFold("details-picker", el("details", { class: "fold" }), !details.length);
  add(pickerFold, el("summary", { text: `Which tables (${selectionLabel()})` }), detailPicker());
  add(box, pickerFold);
  add(box, detailList(adv, { kind: "villain" }, details));
  add(box, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => rollDetail(adv, { kind: "villain" })
  }, `Roll ${selectionLabel()}`));
  return box;
}

function tableChip(table) {
  const on = detailTableIds.has(table.id);
  return el("button", {
    class: `chip ${on ? "on" : ""}`, type: "button",
    "aria-pressed": on ? "true" : "false",
    onclick: () => { toggleDetailTable(table.id); refresh(); }
  }, table.short);
}

function detailPicker() {
  const named = villainDetailTables();
  const namedIds = named.map((t) => t.id);
  const others = meaningTables().filter((t) => !namedIds.includes(t.id));

  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Which tables" }),
    el("small", { class: "field-hint", text: "Tap to pick as many as you like; one press rolls them all, each on its own d100." }));

  const namedRow = el("div", { class: "chip-row" });
  for (const table of named) add(namedRow, tableChip(table));
  add(wrap, namedRow);

  // The Villain Crafter names these seven, so "all seven" is the book's own set
  const allNamed = namedIds.every((id) => detailTableIds.has(id));
  const bulk = el("div", { class: "row-actions" });
  add(bulk,
    el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => {
        if (allNamed) namedIds.forEach((id) => detailTableIds.delete(id));
        else namedIds.forEach((id) => detailTableIds.add(id));
        if (!detailTableIds.size) detailTableIds.add(namedIds[0]);
        refresh();
      }
    }, allNamed ? "Clear the seven" : "All seven The Villain Crafter names"),
    el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => {
        const first = selectedTables()[0] || meaningTables()[0];
        detailTableIds = new Set([first.id]);
        refresh();
        showToast(`Just ${meaningTable(first.id).short}.`);
      }
    }, "Just one"));
  add(wrap, bulk);

  const more = rememberedFold("details-picker-others", el("details", { class: "fold" }), false);
  add(more, el("summary", { text: "Other meaning tables" }));
  const chips = el("div", { class: "chip-row" });
  for (const table of others) add(chips, tableChip(table));
  add(more, chips);
  add(wrap, more);

  const picked = selectedTables();
  add(wrap, el("small", { class: "field-hint", text: picked.length === 1
    ? `${meaningTable(picked[0].id).use} ${meaningTable(picked[0].id).cite}`
    : `${picked.length} tables: ${picked.map((t) => t.short).join(", ")}. Each is rolled separately and read against everything else.` }));
  return wrap;
}

function detailList(adv, target, details) {
  if (!details.length) return el("p", { class: "block-note", text: "Nothing rolled yet." });
  const row = el("div", { class: "dice-row" });
  for (const detail of details) {
    const pill = el("span", { class: "keyword detail-pill", title: `${detail.table} ${detail.roll}` });
    add(pill,
      el("span", { class: "keyword-word", text: detail.word }),
      el("span", { class: "keyword-roll", text: String(detail.roll) }),
      el("button", {
        class: "btn-icon detail-remove", type: "button",
        "aria-label": `Remove ${detail.word} (${detail.table})`,
        onclick: () => { store.removeDetail(adv.id, target, detail.id); refresh(); }
      }, "\u00d7"));
    add(row, pill);
  }
  return row;
}

function rollDetail(adv, target) {
  // One d100 per selected table, each stored and logged on its own: batching the press
  // does not batch the roll.
  const words = selectedTables().map((table) => discover(table.id, { logAs: "detail" }));
  for (const word of words) {
    store.addDetail(adv.id, target, { tableId: word.tableId, table: word.table, roll: word.roll, word: word.word, at: Date.now() });
  }
  refresh();
  showToast(words.map((w) => `${w.table}: ${w.word}`).join(" · "));
}

function partList(parts) {
  const list = el("ul", { class: "crafter-parts" });
  for (const part of parts) {
    if (part.scaffold) continue;
    const item = el("li", {});
    add(item,
      el("span", { class: "part-label", text: part.label }),
      part.word ? el("span", { class: "keyword" }, el("span", { class: "keyword-word", text: part.word })) : null,
      el("span", { class: "part-text", text: part.text }));
    add(list, item);
  }
  return list;
}

function diceRow(rolls, label) {
  const row = el("div", { class: "dice-row" });
  for (const entry of rolls) {
    const value = typeof entry === "number" ? entry : entry.roll;
    add(row, diePill({ die: "d100", value, table: label }));
    if (typeof entry === "object" && entry.mod) {
      add(row, el("span", { class: "arith", text: `${entry.roll} ${signed(entry.mod)} = ${entry.total}` }));
    }
  }
  return row;
}

/**
 * A rolled card collapses to a line - its step, its result, its modifiers - and opens on
 * demand, the way a read reveal and a read underling do (§6.5). The Villain screen was
 * the longest in the app under stress, and these two cards were the part of it you had
 * already read.
 */
function rolledCard(step, cite, gist, fill) {
  const wrap = el("details", { class: "card crafter-card collapsed" });
  const summary = el("summary", { class: "phase-summary" });
  add(summary, el("span", { class: "phase-title", text: step }), el("span", { class: "phase-gist", text: gist }), citeLink(cite, "rule"));
  add(wrap, summary);
  let filled = false;
  const fillOnce = () => { if (!wrap.open || filled) return; filled = true; fill(wrap); };
  wrap.addEventListener("toggle", fillOnce);
  rememberedFold(`rolled:${step}`, wrap, false);
  fillOnce();   // a remembered-open card is filled straight away; toggle does not fire for a set property before mount
  return wrap;
}

function archetypeCard(adv, c, mods) {
  if (c.archetype) {
    const gist = `${c.archetype.parts.filter((p) => !p.scaffold).map((p) => p.label).join(" + ")} · org ${signed(c.archetype.mods.o)} · lt ${signed(c.archetype.mods.l)} · min ${signed(c.archetype.mods.m)}`;
    return rolledCard("1 · The villain", "villain-archetype", gist, (box) => {
      add(box, diceRow(c.archetype.rolls, "Villain Archetype"), partList(c.archetype.parts));
      if (c.archetype.parts.length > 1) {
        add(box, el("p", { class: "block-note", text: "Two archetypes, combined - their modifiers add together." }));
      }
      add(box, inlineRow("Modifiers", `organization ${signed(c.archetype.mods.o)} · lieutenants ${signed(c.archetype.mods.l)} · minions ${signed(c.archetype.mods.m)}`));
      add(box, noteField(adv, "archetype", c.archetype));
      add(box, el("button", { class: "btn btn-quiet", type: "button", onclick: () => rerollArchetype(adv) }, "Re-roll the archetype"));
    });
  }
  const box = el("section", { class: "card crafter-card" });
  add(box, el("h2", { class: "card-title" }, "1 · The villain", citeLink("villain-archetype", "rule")));
  add(box, el("p", { class: "block-note", text: "Who they are and what drives them - and the modifiers everything after this inherits." }),
    el("button", { class: "btn btn-primary", type: "button", onclick: () => rollArchetypeInto(adv) }, "Roll the archetype"));
  return box;
}

function organizationCard(adv, c, mods) {
  if (c.organization) {
    const gist = `${c.organization.parts.filter((p) => !p.scaffold).map((p) => p.label).join(" + ")}${c.organization.upscaled ? " (upscaled)" : ""} · lt ${signed(c.organization.mods.l)} · min ${signed(c.organization.mods.m)}`;
    return rolledCard("3 · The organization", "villain-organization", gist, (box) => {
      add(box, diceRow(c.organization.rolls, "Villain Organization"), partList(c.organization.parts));
      if (c.organization.upscaled) {
        add(box, el("p", { class: "block-note", text: `Upscaled ${c.organization.upscaled === 1 ? "once" : `${c.organization.upscaled} times`}: read the result bigger in size and scope, and both sets of modifiers count.` }));
      }
      add(box, inlineRow("Modifiers", `lieutenants ${signed(c.organization.mods.l)} · minions ${signed(c.organization.mods.m)}`));
      add(box, noteField(adv, "organization", c.organization));
      add(box, el("button", { class: "btn btn-quiet", type: "button", onclick: () => rerollOrganization(adv) }, "Re-roll the organization"));
    });
  }
  const box = el("section", { class: "card crafter-card" });
  add(box, el("h2", { class: "card-title" }, "3 · The organization", citeLink("villain-organization", "rule")));
  const legality = canRollOrganization(adv);
  add(box, el("p", { class: "block-note", text: "What stands behind them - or, sometimes, that nothing does." }),
    el("button", {
      class: "btn btn-primary", type: "button", disabled: legality.ok ? undefined : true,
      onclick: () => rollOrganizationInto(adv)
    }, `Roll the organization (${signed(mods.organization.total)})`),
    legality.ok ? null : el("p", { class: "refusal", text: legality.reason }));
  return box;
}

function underlingsCard(adv, c, mods) {
  const box = el("section", { class: "card crafter-card" });
  add(box, el("h2", { class: "card-title" }, "4 · Lieutenants and minions", citeLink("underlings", "rule")));
  add(box, guidanceNote(crafterGuidance("underlings"), "underlings"));

  const chips = el("div", { class: "chip-row" });
  for (const kind of underlingTable().kinds) {
    add(chips, el("button", {
      class: `chip ${underlingKind === kind.key ? "on" : ""}`, type: "button",
      "aria-pressed": underlingKind === kind.key ? "true" : "false",
      onclick: () => { underlingKind = kind.key; refresh(); }
    }, kind.label));
  }
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Rolling for" }), chips,
    el("small", { class: "field-hint", text: underlingTable().kinds.find((k) => k.key === underlingKind).blurb }));
  add(box, wrap);

  const which = underlingKind === "lieutenant" ? mods.lieutenant : mods.minion;
  add(box, el("p", { class: "block-note", text:
    `Modifier ${signed(which.total)}: archetype ${signed(which.archetype)}${mods.hasOrganization ? `, organization ${signed(which.organization)}` : ", organization not rolled yet"}.` }));

  const legality = canRollUnderling(adv);
  add(box, el("button", {
    class: "btn btn-primary", type: "button", disabled: legality.ok ? undefined : true,
    onclick: () => rollUnderlingInto(adv)
  }, `Roll a ${underlingKind}`),
    legality.ok ? null : el("p", { class: "refusal", text: legality.reason }));

  for (const kind of ["lieutenant", "minion"]) {
    const list = (c[`${kind}s`] || []).slice().reverse();
    if (!list.length) continue;
    add(box, sectionTitle(`${list.length} ${kind}${list.length === 1 ? "" : "s"}`));
    const shown = list.slice(0, rosterPage[kind] * ROSTER_PAGE);
    // The newest stays open; the rest collapse to a line, as reveals do (§6.5).
    shown.forEach((entry, i) => add(box, i === 0 ? underlingCard(adv, entry) : underlingLine(adv, entry)));
    if (list.length > shown.length) {
      add(box, el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => { rosterPage[kind] += 1; refresh(); }
      }, `Show ${Math.min(ROSTER_PAGE, list.length - shown.length)} more of ${list.length}`));
    }
  }
  return box;
}

/** A roster entry you have already read keeps its name, its archetype and a way in. */
function underlingLine(adv, entry) {
  const wrap = el("details", { class: `card underling-card collapsed ${entry.kind}` });
  const summary = el("summary", { class: "phase-summary" });
  add(summary,
    el("span", { class: "phase-title", text: entry.name || entry.parts.map((p) => p.label).join(" + ") }),
    entry.name ? el("span", { class: "phase-gist", text: entry.parts.map((p) => p.label).join(" + ") }) : null);
  add(wrap, summary);
  let filled = false;
  const fillOnce = () => { if (!wrap.open || filled) return; filled = true; add(wrap, underlingBody(adv, entry)); };
  wrap.addEventListener("toggle", fillOnce);
  rememberedFold(`underling:${entry.id}`, wrap, false);
  fillOnce();
  return wrap;
}

function underlingCard(adv, entry) {
  const box = el("article", { class: `card underling-card ${entry.kind}` });
  const head = el("header", { class: "phase-head" });
  add(head,
    el("h3", { class: "phase-title", text: entry.name || entry.parts.map((p) => p.label).join(" + ") }),
    el("span", { class: "phase-date", text: formatDate(entry.at) }));
  add(box, head, underlingBody(adv, entry));
  return box;
}

function underlingBody(adv, entry) {
  const box = el("div", { class: "underling-body" });
  add(box, diceRow(entry.rolls, "Lieutenants & Minions"));

  add(box, partList(entry.parts));
  if (entry.teamwork) add(box, el("p", { class: "block-note", text: "Teamwork: a pair or more, working together - give them the second archetype between them, or roll one each." }));

  const name = el("input", { type: "text", placeholder: "Give them a name", "aria-label": "Name" });
  name.value = entry.name || "";
  name.addEventListener("change", () => {
    store.updateUnderling(adv.id, entry.kind, entry.id, { name: name.value });
    refresh();
  });
  const field = el("label", { class: "field" });
  add(field, el("span", { class: "field-label", text: "Name" }), name);
  add(box, field);

  add(box, detailList(adv, { kind: entry.kind, id: entry.id }, entry.details || []),
    el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => rollDetail(adv, { kind: entry.kind, id: entry.id })
    }, `Roll ${selectionLabel()}`));

  add(box, el("button", {
    class: "btn btn-danger-quiet", type: "button",
    onclick: () => confirmModal({
      title: `Delete this ${entry.kind}?`,
      message: "It goes from the villain's roster.",
      loss: "Its roll, its archetype and any name you gave it are lost. The roll log keeps the dice.",
      confirmLabel: "Delete",
      onConfirm: () => { store.removeUnderling(adv.id, entry.kind, entry.id); refresh(); showToast("Deleted."); }
    })
  }, "Delete"));
  return box;
}

function noteField(adv, which, record) {
  const field = el("textarea", { rows: 3, "aria-label": "What you made of it", placeholder: "What does this mean for your adventure?" });
  field.value = record.note || "";
  field.addEventListener("change", () => {
    store.setCrafted(adv.id, { [which]: { ...record, note: field.value } });
    showToast("Saved.");
  });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "What you made of it" }), field);
  return wrap;
}

function guidanceNote(g, entryId) {
  if (!g || !Settings.showGuidance()) return null;
  const note = el("details", { class: "guidance" });
  add(note, el("summary", { text: g.title }), el("p", { text: g.text }),
    el("p", { class: "block-note" }, citeLink(entryId, "in the rules library"), el("span", { class: "source-cite", text: g.cite })));
  return note;
}

// ------------------------------------------------------------------ actions
function rollArchetypeInto(adv) {
  store.setCrafted(adv.id, { archetype: rollArchetype() });
  refresh();
  showToast("Archetype rolled.");
}

function rollOrganizationInto(adv) {
  const legality = canRollOrganization(adv);
  if (!legality.ok) { showToast(legality.reason, "warn"); return; }
  const mods = modifierBreakdown(adv);
  store.setCrafted(adv.id, { organization: rollOrganization(mods.organization.total) });
  refresh();
  showToast("Organization rolled.");
}

function rollUnderlingInto(adv) {
  const legality = canRollUnderling(adv);
  if (!legality.ok) { showToast(legality.reason, "warn"); return; }
  const mods = modifierBreakdown(adv);
  const mod = underlingKind === "lieutenant" ? mods.lieutenant.total : mods.minion.total;
  const entry = rollUnderling(underlingKind, mod);
  store.addUnderling(adv.id, underlingKind, entry);
  refresh();
  showToast(`${underlingKind === "lieutenant" ? "Lieutenant" : "Minion"} rolled.`);
}

function rerollArchetype(adv) {
  confirmModal({
    title: "Re-roll the archetype?",
    message: "The villain becomes someone else.",
    loss: "The current archetype and anything you wrote about it are replaced. The organization and underlings you already rolled keep their results, but the modifiers that produced them will no longer match.",
    confirmLabel: "Re-roll",
    onConfirm: () => rollArchetypeInto(adv)
  });
}

function rerollOrganization(adv) {
  confirmModal({
    title: "Re-roll the organization?",
    message: "What stands behind the villain becomes something else.",
    loss: "The current organization and your note on it are replaced; underlings already rolled keep their results.",
    confirmLabel: "Re-roll",
    onConfirm: () => rollOrganizationInto(adv)
  });
}

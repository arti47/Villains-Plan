// sheet.js — the in-play surfaces: the persistent header, the dossier, the reveal
// screen and the arc screen. Blocks are ordered by how often they are touched in
// play, not by how the article is chaptered (§6.3.4).

import { el, add, formatDate, formatTime, plural, truncate } from "./core.js";
import {
  explain, actionBar, card, sectionTitle, citeLink, diePill, checkRow, emptyState,
  confirmModal, promptModal, modal, showToast, definitionRow, inlineRow
} from "./ui.js";
import { guidance, arcStage, pivotGate, endGoalRule, fateAnswers } from "./rules.js";
import {
  headerStats, nextStep, phases, planPhases, endGoalPhase, pivotPhases, endGoalRevealed,
  canEarnReveal, canRevealPivot, pivotEligibility, openLeads, endGoalNeeded, endGoalChance,
  endGoalModifier, arcStageKey, endGoalLadder, phaseCount
} from "./derived.js";
import * as store from "./store.js";
import * as roller from "./roller.js";
import * as lifecycle from "./lifecycle.js";
import { Settings } from "./settings.js";
import { askPivot, setPivotOdds, pivotOdds } from "./oracle.js";
import { askOdds, oddsRow } from "./rules.js";
import { refresh, go } from "./router.js";

// ------------------------------------------------------------------ persistent header
/**
 * The two or three numbers that decide every choice, sticky under the app header on
 * every in-play screen (§6.2). The End Goal threshold lives here because it is the
 * game's stake (§3.0 Threshold rule).
 */
export function renderResourceHeader(adv) {
  if (!adv) return null;
  const s = headerStats(adv);
  const wrap = el("div", { class: "resource-header", "aria-live": "polite" });

  const stat = (label, value, cls = "") => {
    const box = el("div", { class: `stat ${cls}` });
    add(box, el("span", { class: "stat-value", text: String(value) }), el("span", { class: "stat-label", text: label }));
    return box;
  };

  // A stat that points at the screen you are already on is not a link (§6.3.9).
  const here = (location.hash || "#/dossier").split("?")[0];
  const statLink = (href, title, node) => (href === here
    ? el("div", { class: "stat-link stat-here", title }, node)
    : el("a", { class: "stat-link", href, title }, node));

  const endGoalCell = s.endGoalRevealed
    ? stat("End Goal", "known", "stat-gold")
    : s.needed === null
      ? stat("End Goal", "out of reach", "stat-quiet")
      : stat("End Goal", `${s.needed}+`, "stat-crimson");

  add(wrap,
    statLink("#/scene", s.scene ? `Scene ${s.scene.n}: ${s.scene.test.label}` : "The Chaos Factor decides how the next scene opens",
      stat("chaos", s.chaos, s.chaos >= 7 ? "stat-crimson" : s.chaos <= 3 ? "stat-quiet" : "")),
    statLink("#/dossier", adv.name, stat(s.phases === 1 ? "phase" : "phases", s.phases)),
    statLink("#/reveal", `d10 + ${s.modifier} against ${endGoalRule().threshold}`, endGoalCell),
    statLink("#/arc", "The arc this adventure is in", stat("arc", arcStage(s.stage).label, "stat-text")));
  return wrap;
}

function nextStepBanner(adv) {
  const step = nextStep(adv);
  const here = (location.hash || "#/dossier").split("?")[0];
  const box = el("div", { class: "next-step" });
  add(box, el("span", { class: "next-label", text: "Next" }),
    step.route === here
      ? el("span", { class: "next-link here", text: step.text })
      : el("a", { class: "next-link", href: step.route, text: step.text }));
  return box;
}

// ------------------------------------------------------------------ the dossier
const DOSSIER_PAGE = 8;      // a reveal list grows without bound otherwise (§6.5)
let dossierPage = 1;

export function renderDossier() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Dossier" }),
    explain("Everything you have learned about the plan, newest reveal first. Each reveal keeps the dice that produced it, what you made of them, and the leads it opened. The article's rule is that a phase should explain one thing and raise another - the leads are the raised half, and they stay counted until you tick them off."));

  if (!adv) {
    add(content, emptyState("No adventure yet. Name a villain and what your character already knows, and the dossier starts here.", "Start an adventure", "#/new"));
    return { content };
  }

  add(content, nextStepBanner(adv), villainCard(adv));

  const list = phases(adv).slice().reverse();
  if (list.length === 0) {
    add(content, emptyState("Nothing revealed yet. Play a scene; when your character has earned it, take the first reveal.", "Earn a reveal", "#/reveal"));
  } else {
    add(content, sectionTitle(`${plural(list.length, "reveal", "reveals")}`, null));
    const shown = list.slice(0, dossierPage * DOSSIER_PAGE);
    shown.forEach((phase, i) => add(content, i === 0 ? phaseCard(adv, phase) : phaseLine(adv, phase)));
    if (list.length > shown.length) {
      add(content, el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => { dossierPage += 1; refresh(); }
      }, `Show ${Math.min(DOSSIER_PAGE, list.length - shown.length)} more of ${list.length}`));
    }
  }

  const action = actionBar({
    label: endGoalRevealed(adv) ? "Go to the arc" : "Earn a reveal",
    context: endGoalRevealed(adv)
      ? `End Goal known · ${arcStage(arcStageKey(adv)).label}`
      : `${plural(phaseCount(adv), "phase", "phases")} known · needs ${endGoalNeeded(adv) === null ? "n/a" : `${endGoalNeeded(adv)}+`}`,
    onClick: () => go(endGoalRevealed(adv) ? "#/arc" : "#/reveal")
  });
  return { content, action };
}

function villainCard(adv) {
  const box = el("div", { class: "card villain-card" });
  const title = el("h2", { class: "villain-name" });
  add(title, adv.villain.name || adv.name,
    adv.villain.epithet ? el("span", { class: "epithet", text: adv.villain.epithet }) : null);   // styled with its own separator
  add(box, title);
  if (adv.villain.behind) add(box, el("p", { class: "block-note", text: `Behind them: ${adv.villain.behind}` }));

  const details = el("details", { class: "fold" });
  add(details, el("summary", { text: "Who they are, and what was known at the start" }));
  add(details,
    editableField(adv, "name", "Villain", adv.villain.name, "Who is behind this?"),
    editableField(adv, "epithet", "Epithet", adv.villain.epithet, "The rogue general, the billionaire..."),
    editableField(adv, "known", "Known at the start", adv.villain.known, "What your character knew before the first reveal.", true),
    editableField(adv, "forces", "Forces and assets", adv.villain.forces, "Armies, agents, money, magic - whatever you have learned.", true),
    editableField(adv, "behind", "The villain behind the villain", adv.villain.behind, "Only if the End Goal turned out to have someone else running them.", true));
  add(box, details);
  return box;
}

function editableField(adv, key, label, value, placeholder, multiline = false) {
  const field = multiline
    ? el("textarea", { rows: 3, placeholder, "aria-label": label })
    : el("input", { type: "text", placeholder, "aria-label": label });
  field.value = value || "";
  field.addEventListener("change", () => {
    store.updateVillain(adv.id, { [key]: field.value });
    showToast(`${label} saved.`);
  });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: label }), field);
  return wrap;
}

// ------------------------------------------------------------------ a reveal card
function phaseTitle(phase) {
  if (phase.kind === "endgoal") return "End Goal";
  if (phase.kind === "pivot") return "Pivot Plan";
  return `Phase ${phase.ordinal}`;
}

/** A read reveal keeps its name, its result and a way back in, and gives up the rest. */
function phaseLine(adv, phase) {
  const wrap = el("details", { class: `card phase-card collapsed ${phase.kind}`, id: `phase-${phase.id}` });
  const summary = el("summary", { class: "phase-summary" });
  const open = openLeadsOf(phase).length;
  add(summary,
    el("span", { class: "phase-title", text: phaseTitle(phase) }),
    el("span", { class: "phase-gist", text: phase.focus ? phase.focus.label : "reveal" }),
    el("span", { class: "phase-words", text: (phase.keywords || []).map((k) => k.word).join(", ") }),
    open ? el("span", { class: "phase-open-leads", text: `${open} lead${open === 1 ? "" : "s"}` }) : null);
  add(wrap, summary);
  let filled = false;
  wrap.addEventListener("toggle", () => {
    if (!wrap.open || filled) return;
    filled = true;
    add(wrap, phaseBody(adv, phase));
  });
  return wrap;
}

function openLeadsOf(phase) { return (phase.leads || []).filter((l) => !l.resolved); }

function phaseCard(adv, phase) {
  const box = el("article", { class: `card phase-card ${phase.kind}`, id: `phase-${phase.id}` });
  const head = el("header", { class: "phase-head" });
  add(head,
    el("h3", { class: "phase-title", text: phaseTitle(phase) }),
    el("span", { class: "phase-date", text: `${formatDate(phase.createdAt)} ${formatTime(phase.createdAt)}` }));
  add(box, head, phaseBody(adv, phase));
  return box;
}

function phaseBody(adv, phase) {
  const isEnd = phase.kind === "endgoal";
  const isPivot = phase.kind === "pivot";
  const box = el("div", { class: "phase-body" });

  if (phase.check) add(box, checkBlock(phase.check));
  if (phase.focus) add(box, focusBlock(phase.focus));
  if (phase.keywords && phase.keywords.length) add(box, keywordBlock(phase));

  if (Settings.showGuidance()) {
    const g = isEnd ? guidance("coherence") : isPivot ? guidance("pivotLength") : guidance("partial");
    if (g) add(box, guidanceNote(g, isEnd ? "coherence" : isPivot ? "pivot-timing" : "partial-reveal"));
  }

  add(box, interpretationField(adv, phase));
  if (isEnd && phase.focus && phase.focus.key === "villain-behind") add(box, villainBehindStep(adv));
  if (isEnd) add(box, coherenceStep(adv, phase));
  add(box, leadsBlock(adv, phase));
  if (phase.earnedNote) add(box, el("p", { class: "earned-note", text: `Earned: ${phase.earnedNote}` }));

  const actions = el("div", { class: "phase-actions" });
  add(actions,
    el("button", { class: "btn btn-quiet", type: "button", onclick: () => rerollKeywords(adv, phase) }, "Re-roll keywords"),
    el("button", { class: "btn btn-danger-quiet", type: "button", onclick: () => removePhase(adv, phase) }, "Delete reveal"));
  add(box, actions);
  return box;
}

function checkBlock(check) {
  const box = el("div", { class: "block check-block" });
  const dice = el("div", { class: "dice-row" });
  add(dice, diePill({ die: "d10", value: check.d10, table: "End Goal Roll" }));
  const sum = el("span", { class: "arith", text: `${check.d10} + ${check.modifier} = ${check.total}` });
  const verdict = el("span", { class: `verdict ${check.fired ? "fired" : "held"}`, text: check.fired ? `${check.total} of ${check.threshold} - the End Goal` : `${check.total} of ${check.threshold} - another phase` });
  add(dice, sum, verdict);
  add(box, el("h4", { class: "block-title" }, "End Goal Roll", citeLink("end-goal-roll", "rule")), dice,
    el("p", { class: "block-note", text: check.needed === null
      ? "With no phases known the threshold is out of a d10's reach, so this reveal could only ever be another phase."
      : `Needed ${check.needed}+ on the d10 with the +${check.modifier} bonus.` }));
  return box;
}

function focusBlock(focus) {
  const box = el("div", { class: "block focus-block" });
  const dice = el("div", { class: "dice-row" });
  add(dice, diePill({ die: "d100", value: focus.roll, table: focus.tableName }),
    el("span", { class: "focus-label", text: focus.label }));
  add(box, el("h4", { class: "block-title" }, focus.tableName,
    citeLink(focus.table === "end-goal-focus" ? "end-goal-focus" : focus.table === "pivot-plan-focus" ? "pivot-focus" : "villain-plan-focus", "rule")), dice);
  if (focus.noContext) {
    add(box, el("p", { class: "block-note no-context" }, guidance("noContext").text, " ", citeLink("no-context", "why this is a result, not a re-roll")));
  } else {
    add(box, el("p", { class: "block-text", text: focus.text }));
  }
  return box;
}

function keywordBlock(phase) {
  const box = el("div", { class: "block keyword-block" });
  const dice = el("div", { class: "dice-row" });
  for (const k of phase.keywords) {
    const pill = el("span", { class: "keyword" });
    add(pill, el("span", { class: "keyword-word", text: k.word }), el("span", { class: "keyword-roll", text: String(k.roll) }));
    add(dice, pill);
  }
  add(box, el("h4", { class: "block-title" }, "Plot Twists", citeLink("plot-twists", "rule")), dice);
  if (phase.doubled) {
    add(box, el("p", { class: "block-note" }, "Both dice landed on the same word - read it as amplification, not a misfire. ", citeLink("doubles", "why")));
  }
  return box;
}

function guidanceNote(g, entryId) {
  const note = el("details", { class: "guidance" });
  add(note, el("summary", { text: g.title }), el("p", { text: g.text }),
    el("p", { class: "block-note" }, citeLink(entryId, "in the rules library"), g.cite ? el("span", { class: "source-cite", text: g.cite }) : null));
  return note;
}

function interpretationField(adv, phase) {
  const field = el("textarea", { rows: 4, "aria-label": "What this means", placeholder: "The dice gave you raw material. What does it mean in the adventure you are already in?" });
  field.value = phase.interpretation || "";
  field.addEventListener("change", () => {
    store.updatePhase(adv.id, phase.id, { interpretation: field.value });
    showToast("Reading saved.");
  });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "What this means" }), field);
  return wrap;
}

/**
 * End Goal Focus 73-76 says the villain you have been chasing is a face, and tells you to
 * work out who is really behind them. A permission the book grants is a feature (§2), so
 * it gets a control rather than a sentence.
 */
function villainBehindStep(adv) {
  const box = el("div", { class: "block villain-behind" });
  add(box, el("h4", { class: "block-title" }, "The villain behind the villain", citeLink("end-goal-focus", "rule")),
    el("p", { class: "block-note", text: "This villain is the public face. Who is running them, and why?" }));
  if (adv.villain.behind) add(box, el("p", { class: "block-text", text: adv.villain.behind }));
  add(box, el("button", {
    class: "btn btn-quiet", type: "button",
    onclick: () => promptModal({
      title: "Who is really behind this?",
      message: "Whatever you name here joins the dossier alongside the villain you have been chasing.",
      label: "The real villain",
      value: adv.villain.behind || "",
      multiline: true,
      confirmLabel: "Record",
      onConfirm: (text) => { store.updateVillain(adv.id, { behind: text.trim() }); refresh(); showToast("Recorded."); }
    })
  }, adv.villain.behind ? "Revise who is behind it" : "Name who is behind it"));
  return box;
}

/** The End Goal's coherence obligation, made a step you cannot miss (A9, §6.6). */
function coherenceStep(adv, phase) {
  const prior = planPhases(adv);
  const box = el("div", { class: "block coherence" });
  add(box, el("h4", { class: "block-title" }, "Does this explain the rest?", citeLink("coherence", "rule")));
  if (prior.length === 0) {
    add(box, el("p", { class: "block-note", text: "There are no earlier phases to reconcile - this End Goal stands alone." }));
    return box;
  }
  add(box, el("p", { class: "block-note", text: "The End Goal has to pull every earlier phase together. Read them back; revise any that no longer fit." }));
  const list = el("ul", { class: "coherence-list" });
  for (const p of prior) {
    const item = el("li", {});
    add(item,
      el("a", { class: "coherence-link", href: `#/dossier?phase=${p.id}`, text: `Phase ${p.ordinal}: ${p.focus ? p.focus.label : "reveal"}` }),
      p.interpretation ? el("span", { class: "coherence-read", text: truncate(p.interpretation, 90) }) : el("span", { class: "coherence-read empty", text: "no reading written" }));
    add(list, item);
  }
  add(box, list);
  return box;
}

function leadsBlock(adv, phase) {
  const box = el("div", { class: "block leads-block" });
  add(box, el("h4", { class: "block-title" }, "Leads", citeLink("partial-reveal", "rule")));
  if (!phase.leads.length) {
    add(box, el("p", { class: "block-note", text: "What got more puzzling? That is your next scene - write it down." }));
  }
  const list = el("ul", { class: "lead-list" });
  for (const lead of phase.leads) {
    const item = el("li", { class: lead.resolved ? "lead resolved" : "lead" });
    add(item, checkRow({
      label: lead.text,
      checked: lead.resolved,
      onChange: () => { store.toggleLead(adv.id, phase.id, lead.id); refresh(); }
    }), el("button", {
      class: "btn-icon", type: "button", "aria-label": `Delete lead: ${lead.text}`,
      onclick: () => { store.deleteLead(adv.id, phase.id, lead.id); refresh(); }
    }, "×"));
    add(list, item);
  }
  add(box, list, el("button", {
    class: "btn btn-quiet", type: "button",
    onclick: () => promptModal({
      title: "Add a lead",
      message: "The thing that got more puzzling - a seized mine, a hired sword, an enemy nobody named.",
      label: "Lead",
      confirmLabel: "Add",
      onConfirm: (text) => { if (store.addLead(adv.id, phase.id, text)) { refresh(); showToast("Lead added."); } }
    })
  }, "Add a lead"));
  return box;
}

function rerollKeywords(adv, phase) {
  confirmModal({
    title: "Re-roll the keywords?",
    message: "The rules do not ask for this - a double is amplification, not a misfire. This is here for when you want it anyway.",
    loss: `The current keywords (${phase.keywords.map((k) => k.word).join(", ")}) are replaced, and the roll log records the re-roll.`,
    confirmLabel: "Re-roll",
    danger: false,
    onConfirm: () => { roller.rerollKeywords(adv, phase.id); refresh(); showToast("Keywords re-rolled."); }
  });
}

function removePhase(adv, phase) {
  const name = phase.kind === "endgoal" ? "the End Goal" : phase.kind === "pivot" ? "the Pivot Plan" : `Phase ${phase.ordinal}`;
  confirmModal({
    title: `Delete ${name}?`,
    message: "This removes the reveal from the dossier.",
    loss: `Its dice, your reading and ${plural(phase.leads.length, "lead", "leads")} go with it${phase.kind === "endgoal" ? ", and the adventure returns to the Discovery arc" : ""}. Later phases renumber. One step of undo is kept.`,
    confirmLabel: "Delete",
    onConfirm: () => { store.deletePhase(adv.id, phase.id); refresh(); showToast(`${name} deleted.`); }
  });
}

// ------------------------------------------------------------------ the reveal screen
export function renderReveal() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Reveal" }),
    explain(`This is where a layer of the plan comes off. The app rolls the End Goal Roll first - a d${endGoalRule().die} plus ${endGoalRule().perPhase} for every phase you already know, against ${endGoalRule().threshold} - and then reads the Focus table and two keywords for whatever that check produced. Earning the reveal is your call, never a roll: press the button when your character has genuinely got somewhere.`));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }

  add(content, nextStepBanner(adv), thresholdCard(adv), earnedGuidance(), interpretGuidance());

  const latest = phases(adv).slice(-1)[0];
  if (latest) {
    add(content, sectionTitle("Most recent reveal"), phaseCard(adv, latest));
  }

  const legality = canEarnReveal(adv);
  const needed = endGoalNeeded(adv);
  const action = actionBar({
    label: "Earn a reveal",
    context: legality.ok
      ? `${plural(phaseCount(adv), "phase", "phases")} known · End Goal on ${needed === null ? "nothing yet" : `${needed}+`} (${endGoalChance(adv)}%)`
      : arcStage(arcStageKey(adv)).label,
    disabled: !legality.ok,
    reason: legality.reason,
    onClick: () => earnReveal(adv),
    secondary: legality.ok ? null : el("a", { class: "btn btn-quiet", href: "#/arc" }, "Go to the arc")
  });
  return { content, action };
}

function thresholdCard(adv) {
  const box = el("div", { class: "card threshold-card" });
  const needed = endGoalNeeded(adv);
  add(box, el("h2", { class: "card-title" }, "The End Goal Roll", citeLink("end-goal-roll", "rule")));
  add(box, inlineRow("Phases known", String(phaseCount(adv))));
  add(box, inlineRow("Bonus", `+${endGoalModifier(adv)}`));
  add(box, inlineRow("Needs", needed === null ? "out of a d10's reach on this reveal" : `${needed}+ on the d10`));
  add(box, inlineRow("Chance", `${endGoalChance(adv)}%`));

  const ladder = el("details", { class: "fold" });
  add(ladder, el("summary", { text: "The whole ladder" }));
  const table = el("table", { class: "ladder" });
  const thead = el("thead", {});
  add(thead, el("tr", {}, el("th", { text: "Reveal" }), el("th", { text: "Known" }), el("th", { text: "Bonus" }), el("th", { text: "Needs" }), el("th", { text: "Chance" })));
  const tbody = el("tbody", {});
  for (const row of endGoalLadder()) {
    add(tbody, el("tr", { class: row.known === phaseCount(adv) ? "here" : "" },
      el("td", { text: `${row.reveal}` }), el("td", { text: `${row.known}` }), el("td", { text: `+${row.modifier}` }),
      el("td", { text: row.needed === null ? "-" : `${row.needed}+` }), el("td", { text: `${row.chance}%` })));
  }
  add(table, thead, tbody);
  add(ladder, el("div", { class: "scroll-x" }, table));
  add(box, ladder);
  return box;
}

function earnedGuidance() {
  const g = guidance("earned");
  const box = el("details", { class: "guidance" });
  add(box, el("summary", { text: g.title }), el("p", { text: g.text }),
    el("p", { class: "block-note" }, citeLink("earned-discovery", "in the rules library"), el("span", { class: "source-cite", text: g.cite })));
  return box;
}

function interpretGuidance() {
  const g = guidance("interpret");
  const box = el("details", { class: "guidance" });
  add(box, el("summary", { text: g.title }), el("p", { text: g.text }),
    el("p", { class: "block-note" }, citeLink("reveal-sequence", "in the rules library"), el("span", { class: "source-cite", text: g.cite })));
  return box;
}

function earnReveal(adv) {
  promptModal({
    title: "Earn a reveal",
    message: "Optional: what did your character do to earn this? It goes into the session record.",
    label: "Why this was earned",
    placeholder: "Survived the ambush and went to the meeting in the assassin's place.",
    multiline: true,
    confirmLabel: "Roll the reveal",
    onConfirm: (note) => {
      const result = roller.revealNext(adv, { earnedNote: note });
      if (!result.ok) { showToast(result.reason, "warn"); return; }
      showRevealResult(store.active(), result);
    }
  });
}

/** A result dialog shows the dice, the arithmetic and the consequence (§6.4). */
function showRevealResult(adv, result) {
  const phase = result.phase;
  const body = el("div", {});
  add(body, phaseCard(adv, phase));
  const isEnd = phase.kind === "endgoal";
  modal({
    title: isEnd ? "The End Goal" : `Phase ${phase.ordinal} revealed`,
    body,
    size: "modal-wide",
    actions: [
      { label: isEnd ? "Read it back in the dossier" : "Write what it means", onClick: () => { go("#/dossier"); } },
      isEnd ? { label: "Go to the arc", onClick: () => { go("#/arc"); } } : null,
      { label: "Close" }
    ].filter(Boolean),
    onClose: () => refresh()
  });
}

// ------------------------------------------------------------------ the arc screen
export function renderArc() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Arc" }),
    explain("The article runs an adventure in arcs rather than scenes: Discovery, then Foiling, then an optional Pivot. This screen owns those boundaries - each one reports exactly what it changed and leaves you one step of undo. Scene-level bookkeeping belongs to Mythic's core rules, which are not in this source, so the app does not invent it."));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }
  add(content, nextStepBanner(adv), arcTrack(adv));

  const stage = arcStageKey(adv);
  if (stage === "pivot" || stage === "concluded") add(content, pivotPanel(adv));

  const undoInfo = lifecycle.undoAvailable();
  if (undoInfo) {
    add(content, card([
      el("h3", { class: "block-title", text: "Undo" }),
      el("p", { class: "block-note", text: `One step back is available: ${undoInfo.label}.` }),
      el("button", { class: "btn btn-quiet", type: "button", onclick: () => {
        const r = lifecycle.undo();
        showToast(r.ok ? `Undone: ${r.label}.` : r.reason);
        refresh();
      } }, "Undo that")
    ], "undo-card"));
  }

  const preview = lifecycle.previewAdvance(adv);
  const action = preview
    ? actionBar({
      label: preview.label,
      context: `${preview.from.label} → ${preview.to.label}`,
      disabled: !!preview.blocked,
      reason: preview.blocked,
      onClick: () => confirmAdvance(adv, preview)
    })
    : actionBar({
      label: "Start another adventure",
      context: "This one is concluded",
      onClick: () => go("#/new")
    });
  return { content, action };
}

function arcTrack(adv) {
  const box = el("div", { class: "card arc-track" });
  const here = arcStageKey(adv);
  const stages = ["discovery", "foiling", "pivot", "concluded"];
  const list = el("ol", { class: "arc-list" });
  for (const key of stages) {
    const s = arcStage(key);
    const passed = stages.indexOf(key) < stages.indexOf(here);
    const item = el("li", { class: `arc-step ${key === here ? "here" : ""} ${passed ? "passed" : ""}` });
    add(item, el("span", { class: "arc-name", text: s.label }), el("span", { class: "arc-blurb", text: s.blurb }));
    add(list, item);
  }
  add(box, el("h2", { class: "card-title" }, "Where this adventure is", citeLink("arcs", "rule")), list);

  const stamps = el("div", { class: "arc-stamps" });
  if (adv.arc.endGoalAt) add(stamps, definitionRow("End Goal revealed", formatDate(adv.arc.endGoalAt)));
  if (adv.arc.defeatedAt) add(stamps, definitionRow("Plan defeated", formatDate(adv.arc.defeatedAt)));
  if (adv.arc.concludedAt) add(stamps, definitionRow("Concluded", formatDate(adv.arc.concludedAt)));
  if (stamps.children.length) add(box, stamps);
  return box;
}

function pivotPanel(adv) {
  const box = el("div", { class: "card pivot-panel" });
  add(box, el("h2", { class: "card-title" }, "Plan B", citeLink("pivot-gate", "rule")),
    el("p", { class: "block-note", text: "A pivot needs somebody left to enact it. Tick whichever of the three the rules allow is true." }),
    Settings.showGuidance() ? guidanceNote(guidance("pivotTiming"), "pivot-timing") : null);

  for (const cond of pivotGate().conditions) {
    add(box, checkRow({
      label: cond.label,
      checked: !!adv.pivotEligible[cond.key],
      onChange: (v) => { store.setPivotFlag(adv.id, cond.key, v); refresh(); }
    }));
  }

  const existing = pivotPhases(adv);
  if (existing.length) {
    add(box, sectionTitle("The pivot"), ...existing.map((p) => phaseCard(adv, p)));
  }

  const legality = canRevealPivot(adv);
  add(box, el("div", { class: "pivot-actions" },
    el("button", {
      class: "btn btn-primary", type: "button", disabled: legality.ok ? undefined : true,
      onclick: () => {
        const r = roller.revealPivot(adv);
        if (!r.ok) { showToast(r.reason, "warn"); return; }
        showToast("Plan B rolled.");
        refresh();
      }
    }, "Roll the Pivot Plan")),
    legality.ok ? null : el("p", { class: "refusal", text: legality.reason }));

  if (existing.length && !legality.ok) {
    add(box, el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => confirmModal({
        title: "Roll a second pivot?",
        message: "The article gives a beaten villain one Plan B. This override is here because it is your table, and it is logged as an override.",
        loss: "The override applies to one roll and is cleared afterwards.",
        confirmLabel: "Allow one more",
        danger: false,
        onConfirm: () => { store.setPivotOverride(adv.id, true); refresh(); showToast("Override armed for one roll."); }
      })
    }, "Override: allow another pivot"));
  }

  add(box, surprisePivotBlock(adv));
  return box;
}

/**
 * The surprise route: finish the adventure, add a cleanup scene, and ask whether the
 * villain pivots at all. The odds come from One-Page Mythic, so the app can roll it
 * (ruling A14) - and a table using physical dice can still record the answer by hand.
 */
function surprisePivotBlock(adv) {
  const box = el("details", { class: "guidance" });
  add(box, el("summary", { text: "Rather be surprised? Ask the Game Master" }));
  add(box, el("p", { text: "The article's other route is to finish the adventure, add one cleanup scene, and ask: does the villain enact a Pivot Plan? Yes or Exceptional Yes and they do. Whatever answer lands here is binding - a No blocks the pivot roll above." }));
  if (Settings.mythicOracle()) add(box, pivotAskRow(adv));
  const row = el("div", { class: "fate-row" });
  for (const answer of fateAnswers()) {
    add(row, el("button", {
      class: `btn btn-quiet ${adv.fateAnswer === answer.key ? "selected" : ""}`, type: "button",
      "aria-pressed": adv.fateAnswer === answer.key ? "true" : "false",
      onclick: () => {
        store.setFateAnswer(adv.id, answer.key);
        store.record(adv.id, "fate", `Fate Question (resolved outside the app): ${answer.label} - ${answer.pivot ? "the villain pivots" : "no pivot"}.`);
        refresh();
        showToast(`Recorded: ${answer.label}.`);
      }
    }, answer.label));
  }
  add(box, el("p", { class: "block-note", text: "Or record an answer you rolled yourself:" }), row);
  if (adv.fateAnswer) {
    add(box, el("p", { class: "block-note", text: `Recorded answer: ${adv.fateAnswer.replace(/-/g, " ")}.` }));
  }
  return box;
}

function pivotAskRow(adv) {
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "Odds that they pivot" }));
  const chips = el("div", { class: "chip-row odds-row" });
  for (const row of askOdds()) {
    add(chips, el("button", {
      class: `chip ${pivotOdds() === row.key ? "on" : ""}`, type: "button",
      "aria-pressed": pivotOdds() === row.key ? "true" : "false",
      onclick: () => { setPivotOdds(row.key); refresh(); }
    }, row.label));
  }
  add(wrap, chips, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => {
      const result = askPivot(adv);
      refresh();
      showToast(`${result.answer.label} (${result.roll} at ${oddsRow(pivotOdds()).label})${result.double ? " - and a random event" : ""}.`);
    }
  }, "Ask the Game Master"));
  return wrap;
}

function confirmAdvance(adv, preview) {
  const body = el("div", {});
  add(body, el("p", { text: `Moving from ${preview.from.label} to ${preview.to.label} does this:` }));
  const list = el("ul", { class: "summary-list" });
  for (const line of preview.changes) add(list, el("li", { text: line }));
  add(body, list, el("p", { class: "block-note", text: "One step of undo is kept." }));
  modal({
    title: preview.label,
    body,
    actions: [
      { label: preview.label, onClick: () => {
        const r = lifecycle.advance(store.active());
        if (!r.ok) { showToast(r.reason, "warn"); return; }
        showToast(`${preview.to.label}. ${r.summary.length} change${r.summary.length === 1 ? "" : "s"} applied.`);
        refresh();
      } },
      { label: "Cancel" }
    ]
  });
}

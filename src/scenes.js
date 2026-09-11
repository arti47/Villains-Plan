// scenes.js — the Mythic scene loop: set an expectation, test it against the Chaos
// Factor, play it, then bookkeep. Plus the Threads and Characters lists the bookkeeping
// phase maintains.
//
// Source note: this subsystem came from a written summary rather than page images, so
// every value it rests on is marked provisional in data-scenes.js and the screens say so
// (§2.1). What the summary names but does not specify is not implemented.

import { el, add, die, uid, now, formatDate, formatTime, plural, truncate } from "./core.js";
import {
  explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast, confirmModal,
  promptModal, modal, inlineRow
} from "./ui.js";
import {
  chaosRule, sceneTestRule, sceneOutcome, clampChaos, listsRule, listKind,
  bookkeepingSteps, notSupplied, scenesSource, sceneAdjustment, sceneAdjustmentTable,
  listSelectionRule, activeSections, sectionFromRoll, lineFromRoll, chaosModes,
  chaosMode as chaosModeRule, randomChaosDelta, progressTrack, chaosModeAvailable,
  resolution as resolutionRule
} from "./rules.js";
import {
  chaos, currentScene, scenes, sceneCount, listItems, listLines, listFull, listNeedsCleanup,
  chaosMode as chaosModeOf, track as trackOf, focusThread, trackComplete, plotArmoured,
  resolutionMode
} from "./derived.js";
import { rollEvent, eventBlock, ask } from "./oracle.js";
import * as store from "./store.js";
import { refresh, go } from "./router.js";

// ------------------------------------------------------------------ engine
/**
 * Test the expected scene. One d10 against the Chaos Factor: over it and the scene runs
 * as you pictured; at or under it, odd alters and even interrupts.
 */
export function testScene(adv, { expectation = "" } = {}) {
  const d10 = die(sceneTestRule().die);
  const level = chaos(adv);
  const outcome = sceneOutcome(d10, level);
  const scene = {
    id: uid("scene"),
    n: sceneCount(adv) + 1,
    test: { d10, chaos: level, kind: outcome.key, label: outcome.label },
    expectation: String(expectation || "").trim(),
    notes: "", adjustments: [], words: [], control: null,
    startedAt: now(), endedAt: null
  };
  const saved = store.addScene(adv.id, scene);
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    question: scene.expectation,
    dice: [{ die: "d10", value: d10, table: `Scene test against chaos ${level}` }],
    summary: outcome.label,
    outcome: `Scene ${scene.n}: ${outcome.label} (${d10} vs chaos ${level})`
  });
  store.record(adv.id, "scene", `Scene ${scene.n}: ${outcome.label} (d10 ${d10} against chaos ${level}).`);
  return saved;
}

/** An Interrupt is generated exactly like a random event: a Focus, then its meaning. */
export function interruptEvent(adv, scene) {
  const event = rollEvent();
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    dice: [
      { die: "d100", value: event.focus.roll, table: "Random Event Focus" },
      ...event.words.map((w) => ({ die: "d100", value: w.roll, table: w.table }))
    ],
    summary: `${event.focus.label}: ${event.words.map((w) => w.word).join(", ")}`,
    outcome: `Interrupt scene: ${event.focus.label}`
  });
  store.updateScene(adv.id, scene.id, { event });
  store.record(adv.id, "scene", `Interrupt: ${event.focus.label} - ${event.words.map((w) => w.word).join(", ")}.`);
  return event;
}

/** One roll on the Scene Adjustment Table. 7-10 is "make 2 adjustments" (ruling A27). */
export function rollAdjustments(adv, scene) {
  const rolls = [];
  const results = [];
  const expand = (depth) => {
    if (depth > 4) return;
    const roll = die(sceneAdjustmentTable().die);
    rolls.push(roll);
    const row = sceneAdjustment(roll);
    if (row.special === "double") { expand(depth + 1); expand(depth + 1); return; }
    results.push({ key: row.key, label: row.label, text: row.text, roll });
  };
  expand(0);
  store.pushLog({
    adventureId: adv.id,
    kind: "scene",
    dice: rolls.map((value) => ({ die: "d10", value, table: "Scene Adjustment" })),
    summary: results.map((r) => r.label).join(" + "),
    outcome: `Scene ${scene.n} altered: ${results.map((r) => r.label).join(" + ")}`
  });
  store.updateScene(adv.id, scene.id, { adjustments: [...(scene.adjustments || []), ...results] });
  return results;
}

/**
 * Picking an entry from a list, the book's way: a section die sized to the active
 * sections, then 1d10 for the line inside it. A blank line is a "Choose" result.
 */
export function rollFromList(adv, kind) {
  const rule = listSelectionRule();
  const lines = [];
  for (const item of listItems(adv, kind)) for (let i = 0; i < item.entries; i += 1) lines.push(item);
  const sectionRule = activeSections(lines.length);
  const dice = [];
  let section = 1;
  if (sectionRule.die) {
    const roll = die(sectionRule.die);
    dice.push({ die: `d${sectionRule.die}`, value: roll, table: `${listKind(kind).label} list - section` });
    section = Math.min(sectionRule.sections, sectionFromRoll(roll));
  }
  const lineRoll = die(rule.lineDie);
  dice.push({ die: "d10", value: lineRoll, table: `${listKind(kind).label} list - line` });
  const index = (section - 1) * 5 + (lineFromRoll(lineRoll) - 1);
  const item = lines[index] || null;

  store.pushLog({
    adventureId: adv.id,
    kind: "list",
    dice,
    summary: item ? item.text : "Choose",
    outcome: item ? `${listKind(kind).label}: ${item.text}` : `${listKind(kind).label}: blank line - Choose`
  });
  return { item, section, line: lineFromRoll(lineRoll), lines: lines.length, dice, choose: !item };
}

/**
 * Bookkeeping: the scene ends, the lists have been updated, and the Chaos Factor moves
 * one step by whether the characters held control. Snapshots first, so it is undoable.
 */
export function endScene(adv, control) {
  const scene = currentScene(adv);
  if (!scene) return { ok: false, reason: "No scene is running." };

  const mode = chaosModeRule(chaosModeOf(adv));
  const before = chaos(adv);
  let rule = null;
  let roll = null;
  let delta = 0;

  if (mode.rollsAtSceneEnd) {
    // Random Chaos: a d10 at the end of the scene decides, not your reading of it.
    roll = die(sceneTestRule().die);
    delta = randomChaosDelta(roll, before);
    rule = { key: "random", label: `Random Chaos (d10 ${roll} against ${before})`, delta };
  } else {
    rule = chaosRule().controls.find((c) => c.key === control);
    if (!rule) return { ok: false, reason: "Say whether the characters were in control." };
    delta = rule.delta;
  }

  store.snapshot(`ending scene ${scene.n}`);
  const after = clampChaos(before + delta);
  store.updateScene(adv.id, scene.id, { control: mode.rollsAtSceneEnd ? "random" : control, endedAt: now() });
  store.setChaos(adv.id, after);
  if (roll !== null) {
    store.pushLog({
      adventureId: adv.id,
      kind: "scene",
      dice: [{ die: "d10", value: roll, table: `Random Chaos against ${before}` }],
      summary: delta < 0 ? "chaos down" : "chaos up",
      outcome: `Random Chaos: ${before} \u2192 ${after}`
    });
  }
  store.record(adv.id, "bookkeeping",
    `Scene ${scene.n} ended ${rule.label.toLowerCase()}; chaos ${before} → ${after}.`);

  const summary = [
    `Scene ${scene.n} is closed as "${rule.label}".`,
    before === after
      ? `The Chaos Factor stays at ${after} - it is already at its ${delta < 0 ? "floor" : "ceiling"}.`
      : `The Chaos Factor moves ${before} to ${after}.`
  ];
  return { ok: true, summary, before, after, scene, roll };
}

// ------------------------------------------------------------------ scene screen
let expectationDraft = "";

export function renderScene() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Scene" }),
    explain("Mythic runs an adventure as scenes. You say how you expect the next one to open, the app rolls a d10 against the Chaos Factor, and the roll decides whether you get the scene you pictured, a twisted version of it, or something else entirely. When the scene is done, bookkeeping moves the Chaos Factor and you update the two lists."));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }

  add(content, provenanceNote(), chaosCard(adv));

  const scene = currentScene(adv);
  if (scene) {
    add(content, sectionTitle(`Scene ${scene.n}`), sceneCard(adv, scene));
  } else {
    add(content, expectationField(adv));
  }

  const past = scenes(adv).filter((sc) => sc.endedAt).reverse();
  if (past.length) {
    add(content, sectionTitle(`${plural(past.length, "scene", "scenes")} played`));
    for (const done of past.slice(0, 6)) add(content, pastSceneLine(done));
  }

  const action = scene
    ? actionBar({
      label: "End the scene",
      context: `Scene ${scene.n} · ${scene.test.label} · chaos ${chaos(adv)}`,
      onClick: () => bookkeep(adv, scene)
    })
    : actionBar({
      label: "Test the scene",
      context: `Chaos ${chaos(adv)} · a d10 over ${chaos(adv)} runs it as expected`,
      onClick: () => {
        const saved = testScene(adv, { expectation: expectationDraft });
        expectationDraft = "";
        refresh();
        showToast(`${saved.test.label} (d10 ${saved.test.d10} vs chaos ${saved.test.chaos}).`);
      }
    });
  return { content, action };
}

function provenanceNote() {
  const src = scenesSource();
  const box = el("details", { class: `guidance ${src.provisional ? "provisional" : ""}` });
  add(box, el("summary", { text: "Where these rules came from" }), el("p", { text: src.note }));
  const list = el("ul", {});
  for (const item of notSupplied()) add(list, el("li", { text: item }));
  add(box, el("p", { class: "block-note", text: "Named in the source but not supplied, so not implemented here:" }), list,
    el("p", { class: "source-cite", text: `${src.cite} (summary)` }));
  return box;
}

function chaosCard(adv) {
  const rule = chaosRule();
  const level = chaos(adv);
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title" }, "The Chaos Factor", citeLink("chaos-factor", "rule")));

  const track = el("div", { class: "chaos-track", role: "group", "aria-label": "Chaos Factor" });
  for (let n = rule.min; n <= rule.max; n += 1) {
    add(track, el("span", { class: `chaos-step ${n === level ? "on" : ""} ${n > 5 ? "high" : ""}`, text: String(n) }));
  }
  add(box, track, chaosModeRow(adv),
    el("p", { class: "block-note", text: level >= 7
      ? "High: expect interruptions and surprises."
      : level <= 3 ? "Low: the adventure will mostly go as you expect."
        : "Even: as likely to twist as to run to plan." }),
    inlineRow("A scene runs as expected on", `${level + 1}+ of a d10`));
  return box;
}

function chaosModeRow(adv) {
  const current = chaosModeOf(adv);
  const wrap = el("div", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "How chaos moves" }));
  const how = resolutionMode(adv);
  const chips = el("div", { class: "chip-row" });
  for (const mode of chaosModes()) {
    const available = chaosModeAvailable(mode.key, how);
    add(chips, el("button", {
      class: `chip ${current === mode.key ? "on" : ""} ${available ? "" : "unavailable"}`, type: "button",
      "aria-pressed": current === mode.key ? "true" : "false",
      onclick: () => {
        if (!available) {
          showToast(`${mode.label} needs the Fate Check: the book's Mid-Chaos chart was not in what this app was built from, so it is not offered on the ${resolutionRule(how).label}.`, "warn");
          return;
        }
        store.setChaosMode(adv.id, mode.key);
        refresh();
        showToast(`${mode.label}.`);
      }
    }, mode.label));
  }
  add(wrap, chips, el("small", { class: "field-hint", text: chaosModeRule(current).text }));
  return wrap;
}

function expectationField(adv) {
  const box = el("div", { class: "card" });
  add(box, el("h2", { class: "card-title", text: "What do you expect to happen?" }),
    el("p", { class: "block-note", text: "Usually what your character means to do next. Write it down before the roll - the test is against your expectation, so it needs to exist first." }));
  const field = el("textarea", { rows: 3, "aria-label": "Your expectation", placeholder: "The PC reaches the mine and finds it guarded." });
  field.value = expectationDraft;
  field.addEventListener("input", () => { expectationDraft = field.value; });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "The expected scene" }), field);
  add(box, wrap);
  return box;
}

function sceneCard(adv, scene) {
  const box = el("article", { class: `card scene-card ${scene.test.kind}` });
  const head = el("header", { class: "phase-head" });
  add(head,
    el("h3", { class: "phase-title", text: scene.test.label }),
    el("span", { class: "phase-date", text: formatTime(scene.startedAt) }));
  add(box, head);

  const dice = el("div", { class: "dice-row" });
  add(dice, diePill({ die: "d10", value: scene.test.d10, table: "Scene test" }),
    el("span", { class: "arith", text: `${scene.test.d10} against chaos ${scene.test.chaos}` }));
  add(box, dice,
    el("p", { class: "block-text", text: sceneTestRule().outcomes.find((o) => o.key === scene.test.kind).text }));

  if (scene.expectation) {
    add(box, el("p", { class: "ask-question", text: `You expected: ${scene.expectation}` }));
  }

  if (scene.test.kind === "altered") add(box, alteredBlock(adv, scene));
  if (scene.test.kind === "interrupt") add(box, interruptBlock(adv, scene));

  const notes = el("textarea", { rows: 3, "aria-label": "What happened", placeholder: "What actually happened in the scene." });
  notes.value = scene.notes || "";
  notes.addEventListener("change", () => { store.updateScene(adv.id, scene.id, { notes: notes.value }); showToast("Saved."); });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: "What happened" }), notes);
  add(box, wrap);
  return box;
}

function alteredBlock(adv, scene) {
  const box = el("div", { class: "block" });
  add(box, el("h4", { class: "block-title" }, "Alter it", citeLink("altered-scene", "rule")),
    el("p", { class: "block-note", text: "One d10 on the Scene Adjustment Table. A 7 or more means two adjustments, so roll again twice." }));

  const made = scene.adjustments || [];
  if (made.length) {
    const dice = el("div", { class: "dice-row" });
    for (const adjustment of made) add(dice, diePill({ die: "d10", value: adjustment.roll, table: "Scene Adjustment" }));
    add(box, dice);
    for (const adjustment of made) {
      add(box, el("p", { class: "block-text" }, el("strong", { text: `${adjustment.label}. ` }), adjustment.text));
    }
  }

  add(box, el("div", { class: "row-actions" },
    el("button", {
      class: "btn btn-primary", type: "button",
      onclick: () => {
        rollAdjustments(adv, store.active().scenes.find((sc) => sc.id === scene.id));
        refresh();
        showToast("Adjustment rolled.");
      }
    }, made.length ? "Roll another adjustment" : "Roll the adjustment"),
    el("a", { class: "btn btn-quiet", href: "#/ask" }, "Ask instead"),
    el("a", { class: "btn btn-quiet", href: "#/meaning" }, "Roll a meaning word")));
  if ((scene.words || []).length) add(box, wordRow(scene.words));
  return box;
}

function interruptBlock(adv, scene) {
  const box = el("div", { class: "block" });
  add(box, el("h4", { class: "block-title" }, "What happens instead", citeLink("interrupt-scene", "rule")),
    el("p", { class: "block-note", text: "An interrupt is built exactly like a random event: roll the Event Focus, then its meaning on the two Action tables, and read them into the situation." }));
  if (scene.event) add(box, eventBlock(scene.event));
  add(box, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => {
      interruptEvent(adv, store.active().scenes.find((sc) => sc.id === scene.id));
      refresh();
      showToast("Interrupt rolled.");
    }
  }, scene.event ? "Roll a different interrupt" : "Roll for the interrupt"));
  return box;
}

function wordRow(words) {
  const row = el("div", { class: "dice-row" });
  for (const word of words) {
    const pill = el("span", { class: "keyword", title: `${word.table} ${word.roll}` });
    add(pill, el("span", { class: "keyword-word", text: word.word }), el("span", { class: "keyword-roll", text: String(word.roll) }));
    add(row, pill);
  }
  return row;
}

function pastSceneLine(scene) {
  const box = el("details", { class: "card phase-card collapsed" });
  const summary = el("summary", { class: "phase-summary" });
  add(summary,
    el("span", { class: "phase-title", text: `Scene ${scene.n}` }),
    el("span", { class: "phase-gist", text: scene.test.label }),
    el("span", { class: "phase-words", text: scene.control === "in" ? "in control" : "out of control" }));
  add(box, summary);
  let filled = false;
  box.addEventListener("toggle", () => {
    if (!box.open || filled) return;
    filled = true;
    add(box,
      scene.expectation ? el("p", { class: "ask-question", text: `Expected: ${scene.expectation}` }) : null,
      scene.notes ? el("p", { class: "block-text", text: scene.notes }) : el("p", { class: "block-note", text: "No note written." }),
      el("p", { class: "block-note", text: `d10 ${scene.test.d10} against chaos ${scene.test.chaos} · ${formatDate(scene.startedAt)}` }));
  });
  return box;
}

/** The bookkeeping phase: lists first, then the Chaos Factor, with one step of undo. */
function bookkeep(adv, scene) {
  const body = el("div", {});
  add(body, el("p", { text: `Scene ${scene.n} is over. Bookkeeping does two things:` }));
  const steps = el("ol", { class: "summary-list" });
  for (const step of bookkeepingSteps()) {
    add(steps, el("li", {}, el("strong", { text: `${step.title}. ` }), step.text));
  }
  add(body, steps,
    el("p", { class: "block-note" }, "Lists live on ", el("a", { class: "cite", href: "#/lists" }, "the Threads and Characters screen"), " - update them before or after this, whichever suits."),
    el("p", { text: "Were the characters generally in control of that scene?" }));

  const mode = chaosModeRule(chaosModeOf(adv));
  const actions = mode.rollsAtSceneEnd
    ? [{ label: "Roll for the Chaos Factor", onClick: () => closeScene() }]
    : chaosRule().controls.map((control) => ({ label: control.label, onClick: () => closeScene(control.key) }));

  function closeScene(controlKey) {
    const result = endScene(store.active(), controlKey);
    if (!result.ok) { showToast(result.reason, "warn"); return; }
    refresh();
    modal({
      title: "Scene closed",
      body: el("div", {}, el("ul", { class: "summary-list" }, ...result.summary.map((line) => el("li", { text: line }))),
        el("p", { class: "block-note", text: "One step of undo is kept." })),
      actions: [
        { label: "Set the next scene", onClick: () => refresh() },
        { label: "Undo", kind: "danger", onClick: () => {
          const label = store.undo();
          showToast(label ? `Undone: ${label}.` : "Nothing to undo.");
          refresh();
        } }
      ]
    });
  }

  if (mode.rollsAtSceneEnd) {
    add(body, el("p", { class: "block-note", text: `${mode.label}: ${mode.text}` }));
  }

  modal({
    title: `Bookkeeping · scene ${scene.n}`,
    body,
    actions: actions.concat([{ label: "Not yet" }])
  });
}

// ------------------------------------------------------------------ lists screen
export function renderLists() {
  const adv = store.active();
  const content = el("div", {});
  add(content, el("h1", { text: "Threads & Characters" }),
    explain("Two lists Mythic keeps: the goals your character is chasing, and the people, places and things that matter. Anything prominent in a scene earns another line, to a maximum of three, so the busiest parts of your story are the likeliest to come back. Twenty-five lines each; when they fill, clean up and the three-line elements come across with two."));

  if (!adv) {
    add(content, emptyState("No adventure yet.", "Start an adventure", "#/new"));
    return { content };
  }

  add(content, trackCard(adv));
  for (const kind of listsRule().kinds) add(content, listCard(adv, kind));
  add(content, selectionNote());
  return { content };
}

/**
 * The Thread Progress Track: a focus thread carries plot armour until its track fills,
 * and the Conclusion is a random event with an automatic focus of Current Context.
 */
function trackCard(adv) {
  const rule = progressTrack();
  const current = trackOf(adv);
  const box = el("section", { class: "card track-card" });
  add(box, el("h2", { class: "card-title" }, "Thread Progress Track", citeLink("progress-track", "rule")));

  if (!current) {
    const threads = listItems(adv, "threads");
    if (!threads.length) {
      add(box, el("p", { class: "block-note", text: "Put a thread on the list first, then you can make it the focus and run a track for it." }));
      return box;
    }
    add(box, el("p", { class: "block-note", text: "Pick one thread to be the focus and give it a track. Until the track fills it carries plot armour: it cannot be finally resolved, however close things look." }));
    const chips = el("div", { class: "chip-row" });
    for (const thread of threads) {
      for (const length of rule.lengths) {
        add(chips, el("button", {
          class: "chip", type: "button",
          onclick: () => {
            store.setTrack(adv.id, { threadId: thread.id, length, points: 0, awards: [], concluded: false, conclusion: null });
            refresh();
            showToast(`${truncate(thread.text, 30)} is the focus thread, on a ${length}-point track.`);
          }
        }, `${truncate(thread.text, 22)} · ${length}`));
      }
    }
    add(box, chips);
    add(box, el("p", { class: "block-note", text: rule.notSupplied }));
    return box;
  }

  const thread = focusThread(adv);
  const complete = trackComplete(adv);
  add(box, el("p", { class: "block-text" }, el("strong", { text: "Focus thread: " }), thread ? thread.text : "(gone from the list)"));

  const bar = el("div", { class: "track-bar", role: "img", "aria-label": `${current.points} of ${current.length} points` });
  for (let i = 0; i < current.length; i += 1) {
    add(bar, el("span", { class: `track-pip ${i < current.points ? "on" : ""}` }));
  }
  add(box, bar, inlineRow("Progress", `${current.points} of ${current.length}`));

  if (!complete) {
    add(box, el("p", { class: "block-note", text: rule.plotArmor }));
    const actions = el("div", { class: "row-actions" });
    for (const award of rule.awards) {
      add(actions, el("button", {
        class: "btn btn-quiet", type: "button", title: award.text,
        onclick: () => {
          store.awardTrack(adv.id, { key: award.key, label: award.label, points: award.points });
          store.record(adv.id, "track", `${award.label}: +${award.points} on the focus thread's track.`);
          refresh();
          showToast(`${award.label}: +${award.points}.`);
        }
      }, `${award.label} +${award.points}`));
    }
    add(box, actions, discoveryBlock(adv, current));
  } else if (current.conclusion) {
    add(box, el("p", { class: "block-note", text: "The plot armour is off. Read this event toward something that can finally end the thread - now, or in the next scene if that sits better." }),
      eventBlock(current.conclusion));
  } else {
    add(box, el("p", { class: "block-note", text: rule.conclusion }),
      el("button", {
        class: "btn btn-primary", type: "button",
        onclick: () => {
          const event = rollEvent({ focusKey: "current-context" });
          store.setTrack(adv.id, { concluded: true, conclusion: event });
          store.pushLog({
            adventureId: adv.id, kind: "track",
            dice: event.words.map((w) => ({ die: "d100", value: w.roll, table: w.table })),
            summary: event.words.map((w) => w.word).join(", "),
            outcome: `Conclusion: ${event.focus.label}`
          });
          store.record(adv.id, "track", `Conclusion rolled: ${event.words.map((w) => w.word).join(", ")}.`);
          refresh();
          showToast("Conclusion rolled.");
        }
      }, "Roll the Conclusion"));
  }

  add(box, el("button", {
    class: "btn btn-danger-quiet", type: "button",
    onclick: () => confirmModal({
      title: "Drop the track?",
      message: "The focus thread stops being the focus.",
      loss: `Its ${current.points} points and the plot armour go with it. The thread itself stays on the list.`,
      confirmLabel: "Drop it",
      onConfirm: () => { store.setTrack(adv.id, null); refresh(); showToast("Track dropped."); }
    })
  }, "Drop the track"));
  return box;
}

/**
 * The Discovery Check: ask whether something is discovered at no less than 50/50, and on
 * a Yes roll 1d10 + current points on the table. Four of its results have no stated
 * effect in the source, so the app names them and applies nothing.
 */
function discoveryBlock(adv, current) {
  const rule = progressTrack().discovery;
  const box = el("details", { class: "guidance" });
  add(box, el("summary", { text: "Stalled? Make a Discovery Check" }),
    el("p", { text: rule.when }), el("p", { class: "block-note", text: rule.gate }));

  const last = (current.awards || []).filter((a) => a.key === "discovery").slice(-1)[0];
  if (last) {
    add(box, el("p", { class: "block-text" }, el("strong", { text: `${last.label}. ` }), last.note || ""));
  }

  add(box, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => {
      const asked = ask({ question: "Is something discovered?", odds: rule.minimumOdds });
      if (!asked.answer.yes) {
        store.record(adv.id, "track", `Discovery Check: ${asked.answer.label} - nothing discovered.`);
        refresh();
        showToast(`${asked.answer.label}: nothing discovered.`);
        return;
      }
      const roll = die(rule.die);
      const total = roll + trackOf(store.active()).points;
      const row = rule.rows.find((r) => total >= r.min && total <= r.max);
      store.pushLog({
        adventureId: adv.id, kind: "track",
        dice: [{ die: "d10", value: roll, table: `Discovery Check +${trackOf(store.active()).points}` }],
        summary: row.label,
        outcome: `Discovery Check ${total}: ${row.label}`
      });
      if (row.award) {
        store.awardTrack(adv.id, { key: "discovery", label: row.label, points: row.award.points, note: row.text });
      } else {
        store.setTrack(adv.id, {
          awards: [...(trackOf(store.active()).awards || []), { key: "discovery", label: row.label, points: 0, note: row.text, at: Date.now() }]
        });
      }
      store.record(adv.id, "track", `Discovery Check (d10 ${roll} + ${total - roll}): ${row.label}.`);
      refresh();
      showToast(`${row.label}${row.award ? "" : " - effect not in the source"}.`);
    }
  }, "Make a Discovery Check"));
  add(box, el("p", { class: "block-note", text: rule.undefinedResults }),
    el("p", { class: "source-cite", text: rule.cite }));
  return box;
}

function selectionNote() {
  const rule = listSelectionRule();
  const box = el("details", { class: "guidance provisional" });
  add(box, el("summary", { text: "How a random event picks from a list" }),
    el("p", { text: "Sections go active as the lines fill, top to bottom. Roll a die sized to the active sections for which section, then a d10 for the line inside it: 1-2 is the first line, 3-4 the second, and so on. Land on a blank line and the result is Choose - take whichever entry fits, or roll again." }));
  const table = el("table", { class: "ladder" });
  const head = el("thead", {});
  add(head, el("tr", {}, el("th", { text: "Lines" }), el("th", { text: "Sections" }), el("th", { text: "Section die" })));
  const body = el("tbody", {});
  for (const row of rule.sectionDice) {
    add(body, el("tr", {}, el("td", { text: `${(row.sections - 1) * 5 + 1}-${row.sections * 5}` }),
      el("td", { text: String(row.sections) }), el("td", { text: row.die ? `d${row.die}` : "no roll" })));
  }
  add(table, head, body);
  add(box, el("div", { class: "scroll-x" }, table),
    el("p", { class: "block-note", text: rule.inferred }),
    el("p", { class: "source-cite", text: `${rule.cite} (summary)` }));
  return box;
}

function listCard(adv, kind) {
  const rule = listsRule();
  const box = el("section", { class: "card" });
  const used = listLines(adv, kind.key);
  add(box, el("h2", { class: "card-title" }, kind.label, citeLink("threads-characters", "rule")),
    el("p", { class: "block-note", text: kind.text }),
    inlineRow("Lines used", `${used} of ${rule.lines}`));

  const items = listItems(adv, kind.key);
  if (!items.length) {
    add(box, el("p", { class: "block-note", text: `Nothing on the ${kind.label.toLowerCase()} list yet.` }));
  } else {
    const list = el("ul", { class: "mythic-list" });
    for (const item of items) add(list, listRow(adv, kind, item, used));
    add(box, list);
  }

  const actions = el("div", { class: "row-actions" });
  add(actions,
    el("button", {
      class: "btn btn-primary", type: "button",
      onclick: () => (listFull(adv, kind.key)
        ? showToast(`The ${kind.label.toLowerCase()} list is full at ${listsRule().lines} lines. Cross something out, or clean up.`, "warn")
        : promptModal({
        title: `Add a ${kind.singular}`,
        message: kind.text,
        label: kind.label,
        placeholder: kind.placeholder,
        confirmLabel: "Add",
        onConfirm: (text) => { if (store.addListItem(adv.id, kind.key, text)) { refresh(); showToast("Added."); } }
      }))
    }, `Add a ${kind.singular}`),
    items.length ? el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => {
        const picked = rollFromList(store.active(), kind.key);
        refresh();
        showToast(picked.choose
          ? `Section ${picked.section}, line ${picked.line} is blank: Choose.`
          : `${picked.item.text} (section ${picked.section}, line ${picked.line})`);
      }
    }, "Roll for an entry") : null);
  add(box, actions);

  if (listFull(adv, kind.key)) {
    add(box, el("p", { class: "refusal", text: `The ${kind.label.toLowerCase()} list is full at ${rule.lines} lines.` }));
    if (listNeedsCleanup(adv, kind.key)) {
      add(box, el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => confirmModal({
          title: `Clean up the ${kind.label.toLowerCase()} list?`,
          message: rule.cleanup,
          loss: `Crossed-out elements are dropped for good. Everything else comes across with a single line, except anything holding ${rule.maxEntries}, which comes across with two. One step of undo is kept.`,
          confirmLabel: "Clean up",
          danger: false,
          onConfirm: () => {
            const result = store.cleanupList(adv.id, kind.key, rule.cleanupEntries);
            refresh();
            showToast(`${result.carried} carried across on ${result.lines} lines; ${result.reduced} reduced.`);
          }
        })
      }, "Clean up the list"));
    }
  }
  return box;
}

function listRow(adv, kind, item, used) {
  const rule = listsRule();
  const row = el("li", { class: "mythic-row" });

  // F37: these were disabled with the reason in a title attribute, which a phone never
  // shows (§13 D-26). They stay enabled and refuse out loud instead (§6.4).
  const weightUp = () => {
    if (item.entries >= rule.maxEntries) {
      showToast(`"${item.text}" already holds ${rule.maxEntries} lines, which is the most any element may have.`, "warn");
      return;
    }
    if (used >= rule.lines) {
      showToast(`The ${kind.label.toLowerCase()} list is full at ${rule.lines} lines. Cross something out, or clean up.`, "warn");
      return;
    }
    store.setListEntries(adv.id, kind.key, item.id, item.entries + 1);
    refresh();
  };
  const weightDown = () => {
    if (item.entries <= 1) {
      showToast(`"${item.text}" holds one line. Cross it out to take that one back.`, "warn");
      return;
    }
    store.setListEntries(adv.id, kind.key, item.id, item.entries - 1);
    refresh();
  };

  add(row,
    el("span", { class: "mythic-text", text: item.text }),
    el("span", {
      class: "mythic-entries",
      title: `${item.entries} of ${rule.maxEntries} lines`,
      "aria-label": `${item.entries} of ${rule.maxEntries} lines`,
      text: "\u25cf".repeat(item.entries) + "\u25cb".repeat(rule.maxEntries - item.entries)
    }),
    el("button", {
      class: "btn-icon", type: "button",
      "aria-label": `Give ${item.text} another line`,
      onclick: weightUp
    }, "+"),
    el("button", {
      class: "btn-icon", type: "button",
      "aria-label": `Take a line back from ${item.text}`,
      onclick: weightDown
    }, "\u2212"),
    el("button", {
      class: "btn-icon", type: "button", "aria-label": `Cross out ${item.text}`,
      onclick: () => (plotArmoured(adv, item.id)
        ? showToast(`"${truncate(item.text, 28)}" is the focus thread and carries plot armour: it cannot be resolved until its track is full.`, "warn")
        : confirmModal({
        title: `Cross out "${item.text}"?`,
        message: "Finished, abandoned, or gone.",
        loss: `All ${plural(item.entries, "line", "lines")} it holds are freed.`,
        confirmLabel: "Cross out",
        onConfirm: () => { store.removeListItem(adv.id, kind.key, item.id); refresh(); showToast("Crossed out."); }
      }))
    }, "\u00d7"));
  return row;
}

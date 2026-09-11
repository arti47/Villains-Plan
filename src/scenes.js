// scenes.js — the Mythic scene loop: set an expectation, test it against the Chaos
// Factor, play it, then bookkeep. Plus the Threads and Characters lists the bookkeeping
// phase maintains.
//
// Source note: this subsystem came from a written summary rather than page images, so
// every value it rests on is marked provisional in data-scenes.js and the screens say so
// (§2.1). What the summary names but does not specify is not implemented.

import { el, add, d100 as rollD100, die, uid, now, formatDate, formatTime, plural } from "./core.js";
import {
  explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast, confirmModal,
  promptModal, modal, inlineRow
} from "./ui.js";
import {
  chaosRule, sceneTestRule, sceneOutcome, clampChaos, sceneAdjustments, listsRule,
  listKind, bookkeepingSteps, notSupplied, scenesSource, housePick
} from "./rules.js";
import {
  chaos, currentScene, scenes, sceneCount, listItems, listLines, listFull, listNeedsCleanup
} from "./derived.js";
import { discover } from "./oracle.js";
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

/** An Interrupt is generated like a random event; the Event Focus table is not in source. */
export function interruptWord(adv, scene) {
  const word = discover("action", { logAs: "scene" });
  store.updateScene(adv.id, scene.id, { words: [...(scene.words || []), word] });
  return word;
}

/**
 * Bookkeeping: the scene ends, the lists have been updated, and the Chaos Factor moves
 * one step by whether the characters held control. Snapshots first, so it is undoable.
 */
export function endScene(adv, control) {
  const scene = currentScene(adv);
  if (!scene) return { ok: false, reason: "No scene is running." };
  const rule = chaosRule().controls.find((c) => c.key === control);
  if (!rule) return { ok: false, reason: "Say whether the characters were in control." };

  store.snapshot(`ending scene ${scene.n}`);
  const before = chaos(adv);
  const after = clampChaos(before + rule.delta);
  store.updateScene(adv.id, scene.id, { control, endedAt: now() });
  store.setChaos(adv.id, after);
  store.record(adv.id, "bookkeeping",
    `Scene ${scene.n} ended ${rule.label.toLowerCase()}; chaos ${before} → ${after}.`);

  const summary = [
    `Scene ${scene.n} is closed as "${rule.label}".`,
    before === after
      ? `The Chaos Factor stays at ${after} - it is already at its ${rule.delta < 0 ? "floor" : "ceiling"}.`
      : `The Chaos Factor moves ${before} to ${after}.`
  ];
  return { ok: true, summary, before, after, scene };
}

/** The house aid: every line is equally likely, so weighting bites (data-house.js). */
export function pickFromList(adv, kind) {
  const items = listItems(adv, kind);
  const lines = [];
  for (const item of items) for (let i = 0; i < item.entries; i += 1) lines.push(item);
  if (!lines.length) return null;
  const roll = rollD100();
  const picked = lines[roll % lines.length];
  store.pushLog({
    adventureId: adv.id,
    kind: "list",
    dice: [{ die: "d100", value: roll, table: `${listKind(kind).label} list (house aid)` }],
    summary: picked.text,
    outcome: `${listKind(kind).label}: ${picked.text}`
  });
  return { item: picked, roll, lines: lines.length };
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
  const box = el("details", { class: "guidance provisional" });
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
  add(box, track,
    el("p", { class: "block-note", text: level >= 7
      ? "High: expect interruptions and surprises."
      : level <= 3 ? "Low: the adventure will mostly go as you expect."
        : "Even: as likely to twist as to run to plan." }),
    inlineRow("A scene runs as expected on", `${level + 1}+ of a d10`));
  return box;
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
    el("p", { class: "block-note", text: sceneAdjustments().note }));
  const chosen = new Set(scene.adjustments || []);
  const list = el("div", { class: "chip-row" });
  for (const option of sceneAdjustments().options) {
    add(list, el("button", {
      class: `chip ${chosen.has(option.key) ? "on" : ""}`, type: "button",
      "aria-pressed": chosen.has(option.key) ? "true" : "false",
      title: option.text,
      onclick: () => {
        const next = chosen.has(option.key)
          ? (scene.adjustments || []).filter((k) => k !== option.key)
          : [...(scene.adjustments || []), option.key];
        store.updateScene(adv.id, scene.id, { adjustments: next });
        if (option.key === "meaning") { const word = interruptWord(adv, store.active().scenes.find((s) => s.id === scene.id)); showToast(`${word.table}: ${word.word}`); }
        if (option.key === "fate-question") { go("#/ask"); return; }
        refresh();
      }
    }, option.label));
  }
  add(box, list);
  for (const key of scene.adjustments || []) {
    const option = sceneAdjustments().options.find((o) => o.key === key);
    if (option) add(box, el("p", { class: "block-note", text: `${option.label}: ${option.text}` }));
  }
  if ((scene.words || []).length) add(box, wordRow(scene.words));
  return box;
}

function interruptBlock(adv, scene) {
  const box = el("div", { class: "block" });
  add(box, el("h4", { class: "block-title" }, "What happens instead", citeLink("interrupt-scene", "rule")),
    el("p", { class: "block-note", text: "An interrupt is built like a random event. Mythic rolls an Event Focus first; that table is not in the source this app was built from, so the app rolls meaning words and leaves the focus to you." }));
  if ((scene.words || []).length) add(box, wordRow(scene.words));
  add(box, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => {
      const word = interruptWord(adv, store.active().scenes.find((s) => s.id === scene.id));
      refresh();
      showToast(`${word.table}: ${word.word}`);
    }
  }, (scene.words || []).length ? "Another word" : "Roll for the interrupt"));
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

  modal({
    title: `Bookkeeping · scene ${scene.n}`,
    body,
    actions: chaosRule().controls.map((control) => ({
      label: control.label,
      onClick: () => {
        const result = endScene(store.active(), control.key);
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
    })).concat([{ label: "Not yet" }])
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

  for (const kind of listsRule().kinds) add(content, listCard(adv, kind));
  add(content, el("p", { class: "block-note", text: housePick().text }));
  return { content };
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
        const picked = pickFromList(store.active(), kind.key);
        refresh();
        if (picked) showToast(`${picked.item.text} (1 of ${picked.lines} lines)`);
      }
    }, housePick().label) : null);
  add(box, actions);

  if (listFull(adv, kind.key)) {
    add(box, el("p", { class: "refusal", text: `The ${kind.label.toLowerCase()} list is full at ${rule.lines} lines.` }));
    if (listNeedsCleanup(adv, kind.key)) {
      add(box, el("button", {
        class: "btn btn-quiet", type: "button",
        onclick: () => confirmModal({
          title: `Clean up the ${kind.label.toLowerCase()} list?`,
          message: rule.cleanup,
          loss: `Crossed-out elements are dropped for good, and anything holding ${rule.maxEntries} lines comes across with ${rule.cleanupTo}. One step of undo is kept.`,
          confirmLabel: "Clean up",
          danger: false,
          onConfirm: () => {
            const result = store.cleanupList(adv.id, kind.key, rule.cleanupTo);
            refresh();
            showToast(`${result.carried} carried across, ${result.reduced} reduced to ${rule.cleanupTo}.`);
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
      onclick: () => confirmModal({
        title: `Cross out "${item.text}"?`,
        message: "Finished, abandoned, or gone.",
        loss: `All ${plural(item.entries, "line", "lines")} it holds are freed.`,
        confirmLabel: "Cross out",
        onConfirm: () => { store.removeListItem(adv.id, kind.key, item.id); refresh(); showToast("Crossed out."); }
      })
    }, "\u00d7"));
  return row;
}

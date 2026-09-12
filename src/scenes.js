// scenes.js — the Scene screen: set an expectation, test it against the Chaos Factor,
// play it, then bookkeep. The engine is scene-engine.js; the lists and the track have
// their own modules.

import { el, add, die, formatDate, formatTime, plural } from "./core.js";
import { explain, actionBar, sectionTitle, citeLink, diePill, emptyState, showToast, modal, inlineRow } from "./ui.js";
import { chaosRule, sceneTestRule, bookkeepingSteps, notSupplied, scenesSource, chaosModes, chaosMode as chaosModeRule } from "./rules.js";
import { chaos, currentScene, scenes, chaosMode as chaosModeOf } from "./derived.js";
import { eventBlock, ask } from "./oracle.js";
import * as store from "./store.js";
import { refresh, go } from "./router.js";
import { testScene, interruptEvent, rollAdjustments, endScene } from "./scene-engine.js";

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
  const chips = el("div", { class: "chip-row" });
  for (const mode of chaosModes()) {
    add(chips, el("button", {
      class: `chip ${current === mode.key ? "on" : ""}`, type: "button",
      "aria-pressed": current === mode.key ? "true" : "false",
      onclick: () => {
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

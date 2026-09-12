// track.js — the Thread Progress Track card: phases, awards, the owed flashpoint, the
// Discovery Check, the Conclusion. Lives on the Lists screen.

import { el, add, die, now, truncate } from "./core.js";
import { citeLink, showToast, confirmModal, inlineRow } from "./ui.js";
import { notSupplied, progressTrack } from "./rules.js";
import { currentScene, listItems, track as trackOf, focusThread, trackComplete, trackPhases, owedFlashpoint } from "./derived.js";
import { rollEvent, eventBlock, ask, discover } from "./oracle.js";
import * as store from "./store.js";
import { refresh, go } from "./router.js";

// the words the last Discovery Check turned up, shown until the screen is left
let lastDiscovery = null;

/**
 * The Thread Progress Track: a focus thread carries plot armour until its track fills,
 * and the Conclusion is a random event with an automatic focus of Current Context.
 */
export function trackCard(adv) {
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

  // The book's per-phase question, which is what makes a flashpoint compulsory
  const phases = trackPhases(adv);
  const phaseRow = el("div", { class: "chip-row phase-row" });
  for (const phase of phases) {
    const state = phase.flashpoint ? "on" : (phase.complete ? "warn" : "");
    add(phaseRow, el("span", { class: `chip static ${state}`,
      title: `Points ${phase.from}-${phase.to}. ${phase.flashpoint ? "A flashpoint happened." : phase.complete ? "No flashpoint happened, so the track triggered one." : "Did a flashpoint happen?"}` },
      `${phase.from}-${phase.to}${phase.flashpoint ? " ✓" : ""}`));
  }
  add(box, el("p", { class: "field-label", text: "Did a flashpoint happen?" }), phaseRow,
    el("small", { class: "field-hint", text: `${rule.phaseFlashpoint.text} ${rule.phaseFlashpoint.both}` }));

  if (current.pendingFlashpoint) {
    add(box, el("p", { class: "block-note warn", text: `A phase ended without a flashpoint during bookkeeping, so the track owes you one. ${rule.phaseFlashpoint.timing}` }));
  }
  if (current.flashpoint) {
    add(box, el("p", { class: "block-note", text: "The track triggered this flashpoint. It involves the focus thread dramatically, but does not resolve it." }),
      eventBlock(current.flashpoint));
  }

  if (!complete) {
    add(box, el("p", { class: "block-note", text: rule.plotArmor }));
    const actions = el("div", { class: "row-actions" });
    for (const award of rule.awards) {
      add(actions, el("button", {
        class: "btn btn-quiet", type: "button", title: award.text,
        onclick: () => {
          const fired = scoreTrack(adv, { key: award.key, kind: award.key, label: award.label, points: award.points });
          store.record(adv.id, "track", `${award.label}: +${award.points} on the focus thread's track.`);
          refresh();
          showToast(`${award.label}: +${award.points}.${fired ? (fired.pending ? " A phase flashpoint is owed next scene." : " The phase ended without one, so the track triggered a flashpoint.") : ""}`);
        }
      }, `${award.label} +${award.points}`));
    }
    add(box, actions, discoveryBlock(adv, current));
  } else if (current.conclusion) {
    add(box, el("p", { class: "block-note", text: "The plot armour is off. Read this event toward something that can finally end the thread." }),
      eventBlock(current.conclusion),
      el("p", { class: "block-note", text: rule.conclusionDelay }));
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
 * Score points on the track, then honour the phase rule: the track is phases of five
 * points, each asking "did a flashpoint happen?", and a phase that completes without one
 * makes one happen.
 *
 * Timing is the book's: cross the threshold while a scene is running and the flashpoint
 * fires now; cross it during end-of-scene bookkeeping and it waits for the next scene.
 */
function scoreTrack(adv, award) {
  store.awardTrack(adv.id, award);
  const owed = owedFlashpoint(store.active());
  if (!owed || trackComplete(store.active())) return null;   // the Conclusion supersedes it
  const scene = currentScene(store.active());
  if (!scene) {
    store.setTrack(adv.id, { pendingFlashpoint: true });
    store.record(adv.id, "track", `Phase ${owed.index + 1} ended with no flashpoint: one is owed, and lands at the start of the next scene.`);
    return { pending: true, phase: owed };
  }
  const event = rollEvent({ focusKey: "current-context" });
  store.setTrack(adv.id, { flashpoint: event, pendingFlashpoint: false });
  store.pushLog({
    adventureId: adv.id, kind: "track",
    dice: event.words.map((w) => ({ die: "d100", value: w.roll, table: w.table })),
    summary: event.words.map((w) => w.word).join(", "),
    outcome: `Phase ${owed.index + 1} flashpoint`
  });
  store.record(adv.id, "track", `Phase ${owed.index + 1} ended with no flashpoint, so the track triggered one: ${event.words.map((w) => w.word).join(", ")}.`);
  return { event, phase: owed };
}

/** One roll on the Thread Discovery Check table, applied and logged. */
function rollDiscovery(adv, rule) {
  const roll = die(rule.die);
  const points = trackOf(store.active()).points;
  const total = roll + points;
  const row = rule.rows.find((r) => total >= r.min && total <= r.max);
  store.pushLog({
    adventureId: adv.id, kind: "track",
    dice: [{ die: "d10", value: roll, table: `Discovery Check +${points}` }],
    summary: row.label,
    outcome: `Discovery Check ${total}: ${row.label}`
  });
  // A successful Discovery Check IS a random event - this table stands in for the Event
  // Focus table - so it gets meaning words to read, like any other event.
  const words = [discover("action-1", { logAs: "track" }), discover("action-2", { logAs: "track" })];
  scoreTrack(adv, { key: "discovery", kind: row.award.kind, label: row.label, points: row.award.points, note: row.text });
  store.record(adv.id, "track",
    `Discovery Check (d10 ${roll} + ${points}): ${row.label} - ${words.map((w) => w.word).join(", ")}.`);
  return { ...row, words };
}

/**
 * The Discovery Check. Ask "Is something discovered?" at no less than 50/50; what the
 * answer buys you is the Discovery Fate Question table, which is why this is not a plain
 * yes/no: an Exceptional Yes rolls the table TWICE and combines, and an Exceptional No
 * shuts Discovery down for the rest of the scene. Four of the table's eight results have
 * no stated effect, so the app names them and applies nothing.
 */
function discoveryBlock(adv, current) {
  const rule = progressTrack().discovery;
  const box = el("details", { class: "guidance" });
  add(box, el("summary", { text: "Stalled? Make a Discovery Check" }),
    el("p", { text: rule.when }), el("p", { class: "block-note", text: rule.gate }));

  const table = el("table", { class: "ladder" });
  add(table, el("thead", {}, el("tr", {}, el("th", { text: "Answer" }), el("th", { text: "What it buys" }))));
  const body = el("tbody", {});
  for (const answer of rule.answers) {
    add(body, el("tr", {}, el("td", { text: answer.label }), el("td", { text: answer.text })));
  }
  add(table, body);
  add(box, el("div", { class: "scroll-x" }, table));

  const last = (current.awards || []).filter((a) => a.key === "discovery").slice(-1)[0];
  if (last) {
    add(box, el("p", { class: "block-text" }, el("strong", { text: `${last.label}. ` }), last.note || ""));
  }
  if (lastDiscovery) {
    for (const result of lastDiscovery) {
      add(box, el("p", { class: "block-note" },
        el("strong", { text: `${result.label}: ` }),
        result.words.map((w) => w.word).join(", "),
        " — read it as you would any random event."));
    }
  }
  add(box, el("p", { class: "block-note", text: rule.asRandomEvent }));

  const scene = currentScene(adv);
  const closed = Boolean(scene && scene.discoveryClosed);
  if (closed) {
    add(box, el("p", { class: "block-note warn", text: "An Exceptional No ended Discovery for this scene: your character has hit a dead end and must search again in another scene. Start the next scene to try again." }));
  }

  add(box, el("button", {
    class: "btn btn-primary", type: "button",
    onclick: () => {
      if (closed) {
        showToast("An Exceptional No shut Discovery down for this scene. It opens again in the next one.", "warn");
        return;
      }
      const asked = ask({ question: "Is something discovered?", odds: rule.minimumOdds });
      const answer = rule.answers.find((a) => a.key === asked.answer.key) || rule.answers.find((a) => a.key === "no");
      // The Exceptional No shuts Discovery down for the rest of THIS scene, so it is
      // recorded on the scene. With no scene open there is nothing to shut.
      if (answer.closesScene && scene) store.updateScene(adv.id, scene.id, { discoveryClosed: true });
      if (!answer.rolls) {
        store.record(adv.id, "track", `Discovery Check: ${asked.answer.label} - ${answer.text}`);
        refresh();
        showToast(`${asked.answer.label}: nothing discovered.${answer.closesScene ? " Discovery is shut for this scene." : ""}`, answer.closesScene ? "warn" : undefined);
        return;
      }
      const rolled = [];
      for (let i = 0; i < answer.rolls; i += 1) rolled.push(rollDiscovery(adv, rule));
      lastDiscovery = rolled;
      if (answer.rolls > 1) {
        store.record(adv.id, "track", `${asked.answer.label}: rolled twice and combined - ${rolled.map((r) => r.label).join(" + ")}.`);
      }
      refresh();
      showToast(rolled.map((r) => `${r.label}: ${r.words.map((w) => w.word).join(", ")}`).join(" · "));
    }
  }, "Make a Discovery Check"));
  add(box, el("p", { class: "block-note", text: rule.allDefined }),
    el("p", { class: "source-cite", text: rule.cite }));
  return box;
}

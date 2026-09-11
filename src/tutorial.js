// tutorial.js — a first session, step by step. Its own screen, not a modal sequence,
// so a player can come back to it mid-session (§6.6 layer 3).

import { el, add } from "./core.js";
import { explain, citeLink, actionBar, emptyState } from "./ui.js";
import { tutorialSteps } from "./rules.js";
import * as store from "./store.js";
import { go } from "./router.js";

export function renderTutorial() {
  const content = el("div", {});
  add(content, el("h1", { text: "A first session" }),
    explain("Ten steps in play order: what to tap and why the rules ask for it. Written for someone who has not read the article. Open the steps as you go - it is a screen, so you can come back to it in the middle of a session."));

  const adv = store.active();
  const steps = tutorialSteps();
  const list = el("ol", { class: "tutorial" });
  for (const step of steps) {
    const item = el("li", {});
    const details = el("details", { class: "tutorial-step" });
    add(details, el("summary", { text: step.title }), el("p", { text: step.body }));
    add(item, details);
    add(list, item);
  }
  add(content, list);

  add(content, el("p", { class: "block-note" },
    "The full rules, one entry per automated rule, are in ", citeLink("what-this-is", "the rules library"), "."));

  if (!adv) {
    add(content, emptyState("Ready? The first step is naming a villain.", "Start an adventure", "#/new"));
  }

  const action = actionBar({
    label: adv ? "Back to the dossier" : "Start an adventure",
    context: adv ? adv.name : "Nothing started yet",
    onClick: () => go(adv ? "#/dossier" : "#/new")
  });
  return { content, action };
}

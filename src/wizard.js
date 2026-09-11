// wizard.js — starting an adventure. There is no character to build: this subsystem
// tracks a plan, so the "creation" flow is the dossier's opening state (§3.7).
// A screen you go into, so it carries no section nav (§6.3.1).

import { el, add } from "./core.js";
import { explain, actionBar, showToast, citeLink } from "./ui.js";
import * as store from "./store.js";
import { go } from "./router.js";

const draft = { name: "", villainName: "", epithet: "", known: "", forces: "" };
let step = 0;

const STEPS = [
  { key: "who", label: "Who you are up against" },
  { key: "known", label: "What you already know" }
];

export function resetWizard() { step = 0; for (const k of Object.keys(draft)) draft[k] = ""; }

function field({ key, label, placeholder, multiline = false, hint = null }) {
  const input = multiline
    ? el("textarea", { rows: 4, placeholder, "aria-label": label })
    : el("input", { type: "text", placeholder, "aria-label": label });
  input.value = draft[key];
  input.addEventListener("input", () => { draft[key] = input.value; });
  const wrap = el("label", { class: "field" });
  add(wrap, el("span", { class: "field-label", text: label }), input, hint ? el("small", { class: "field-hint", text: hint }) : null);
  return wrap;
}

export function renderWizard() {
  const content = el("div", {});
  add(content, el("h1", { text: "Start an adventure" }),
    explain("Two short steps, and none of it is fixed - every field stays editable in the dossier. The article assumes you already know a villain exists and suspect a plan; what it reveals is what that plan actually is."));

  const current = STEPS[step];
  add(content, el("p", { class: "step-line", text: `Step ${step + 1} of ${STEPS.length} · ${current.label}` }));

  if (step === 0) {
    add(content,
      field({ key: "name", label: "Adventure name", placeholder: "The General Who Did Not Go Home", hint: "For your own list. A working title is fine." }),
      field({ key: "villainName", label: "Villain", placeholder: "Who is behind it?" }),
      field({ key: "epithet", label: "Epithet", placeholder: "The rogue general · the billionaire · the dark shaman", hint: "Optional." }));
  } else {
    add(content,
      field({ key: "known", label: "What your character already knows", placeholder: "A victorious general has not gone home, and is absorbing his defeated enemy's henchmen.", multiline: true,
        hint: "The starting position. Reveals build on top of this." }),
      field({ key: "forces", label: "Forces and assets, if any are known", placeholder: "An army camped at the stronghold. Unknown funds.", multiline: true, hint: "Optional." }));
    const note = el("p", { class: "block-note" });
    add(note, "No stats, no sheet: this tool tracks a plan. ", citeLink("what-this-is", "why"));
    add(content, note);
  }

  const last = step === STEPS.length - 1;
  const action = actionBar({
    label: last ? "Start the adventure" : "Next",
    context: `Step ${step + 1} of ${STEPS.length} · ${current.label}`,
    onClick: () => {
      if (!last) {
        if (!draft.name.trim() && !draft.villainName.trim()) {
          showToast("Give the adventure or the villain a name first.", "warn");
          return;
        }
        step += 1;
        go("#/new", { force: true });
        return;
      }
      const adv = store.createAdventure({
        name: draft.name.trim() || `Against ${draft.villainName.trim() || "an unknown villain"}`,
        villainName: draft.villainName.trim(),
        epithet: draft.epithet.trim(),
        known: draft.known.trim(),
        forces: draft.forces.trim()
      });
      resetWizard();
      showToast(`"${adv.name}" started.`);
      go("#/reveal");
    },
    secondary: step > 0
      ? el("button", { class: "btn btn-quiet", type: "button", onclick: () => { step -= 1; go("#/new", { force: true }); } }, "Back")
      : el("a", { class: "btn btn-quiet", href: "#/adventures" }, "Cancel")
  });

  return { content, action, noHeader: true };
}

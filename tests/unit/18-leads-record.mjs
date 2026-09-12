// unit: leads & record
import { test, assert, equal } from "../harness.mjs";
import { derived, store, roller, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- leads & record
test("a lead persists, toggles and counts in the header", () => {
  const adv = freshAdventure();
  const r = roller.revealNext(store.active());
  store.addLead(adv.id, r.phase.id, "Who is paying the diggers?");
  equal(derived.openLeads(store.active()).length, 1, "counted while open");
  store.toggleLead(adv.id, r.phase.id, store.active().phases[0].leads[0].id);
  equal(derived.openLeads(store.active()).length, 0, "not counted once resolved");
  // The count lives on the Dossier tab's badge, not in the header: one number, one place
  // (docs/AUDIT.md F38).
  equal(derived.headerStats(store.active()).openLeads, undefined, "the header does not carry it");
});

test("the session record grows as the adventure is played", () => {
  const adv = freshAdventure();
  roller.revealNext(store.active());
  const rows = store.sessionRecord(adv.id);
  assert(rows.length >= 2, "a start row and a reveal row");
});

test("nextStep always names something to do", () => {
  equal(typeof derived.nextStep(null).text, "string", "with no adventure");
  const adv = freshAdventure();
  for (const stage of ["discovery", "foiling", "pivot", "concluded"]) {
    store.setArcStage(adv.id, stage, {});
    const step = derived.nextStep(store.active());
    assert(step.text && step.route, `${stage} has an onward route`);
  }
});

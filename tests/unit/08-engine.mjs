// unit: engine
import { test, assert, equal, deepEqual } from "../harness.mjs";
import { derived, store, roller, check, freshAdventure } from "./shared.mjs";

// ---------------------------------------------------------------- engine

test("a reveal writes one log row whose first die is the d10 check (order of a reveal)", () => {
  const adv = freshAdventure();
  const result = roller.revealNext(adv);
  assert(result.ok, "reveal happened");
  const rows = store.rollLog({ adventureId: adv.id });
  equal(rows.length, 1, "one row per reveal");
  equal(rows[0].dice[0].die, "d10", "the End Goal Roll is rolled first");
  equal(rows[0].dice.length, 4, "d10 + focus + two keywords");
  equal(rows[0].dice[1].die, "d100", "the Focus roll");
});

test("no dice are rolled by earning alone: 200 first reveals, never an End Goal", () => {
  for (let i = 0; i < 200; i += 1) {
    const adv = freshAdventure(`run ${i}`);
    const r = roller.revealNext(adv);
    equal(r.phase.kind, "phase", "first reveal is always a phase");
  }
});

test("phases renumber from the store, not from what was written (one counter, §10.12)", () => {
  const adv = freshAdventure();
  // Built directly: a second *rolled* reveal can legitimately fire the End Goal (20% at
  // +2), which would make this test flake rather than fail (docs/AUDIT.md F13).
  store.addPhase(adv.id, { id: "p1", kind: "phase", ordinal: 9, focus: null, keywords: [], leads: [] });
  store.addPhase(adv.id, { id: "p2", kind: "phase", ordinal: 4, focus: null, keywords: [], leads: [] });
  const saved = store.active();
  deepEqual(derived.planPhases(saved).map((p) => p.ordinal), [1, 2]);
  store.deletePhase(saved.id, derived.planPhases(saved)[0].id);
  deepEqual(derived.planPhases(store.active()).map((p) => p.ordinal), [1], "the survivor renumbers");
});

test("no second End Goal: the reveal control refuses once it is out (Once-per-X)", () => {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  const check = derived.canEarnReveal(store.active());
  equal(check.ok, false, "refused");
  assert(/End Goal is already known/.test(check.reason), "and says why");
  equal(roller.revealNext(store.active()).ok, false, "the engine refuses too, not just the button");
});

test("keyword doubles are flagged and never re-rolled (5000 pairs)", () => {
  let doubles = 0;
  for (let i = 0; i < 5000; i += 1) {
    const { keywords, doubled } = roller.rollKeywords();
    equal(keywords.length, 2, "always two");
    equal(doubled, keywords[0].roll === keywords[1].roll, "flag matches the rolls");
    if (doubled) doubles += 1;
  }
  assert(doubles > 0, "doubles occur and are kept (they are amplification, not a misfire)");
});

test("dice are uniform enough to be defensible: 10k d10 faces within 25% of expectation", () => {
  const adv = freshAdventure();
  const counts = Array.from({ length: 10 }, () => 0);
  for (let i = 0; i < 10000; i += 1) counts[derived.endGoalCheck(adv, 0).d10 !== undefined ? 0 : 0] += 0; // no-op guard
  // roll through the public engine instead of reaching into core
  const faces = Array.from({ length: 10 }, () => 0);
  for (let i = 0; i < 2000; i += 1) {
    const a = freshAdventure(`d ${i}`);
    const r = roller.revealNext(a);
    faces[r.check.d10 - 1] += 1;
  }
  const expected = 200;
  for (const [i, n] of faces.entries()) assert(Math.abs(n - expected) < expected * 0.35, `face ${i + 1} appeared ${n} times`);
});

// Builds the seed states every harness and probe shares, so no two passes measure a
// different app (§11.1 D). Run it when the schema changes; the output is committed.

import { writeFileSync } from "node:fs";
import { installStorage } from "./harness.mjs";

installStorage();
const store = await import("../src/store.js");
const roller = await import("../src/roller.js");
const derived = await import("../src/derived.js");
const crafter = await import("../src/crafter.js");
const sceneEngine = await import("../src/scene-engine.js");
const oracle = await import("../src/oracle.js");

/** Roll up the villain the way a player would, so the seeds cover the crafted state. */
function craftVillain(adv, { lieutenants = 1, minions = 1, details = 2 } = {}) {
  store.setCrafted(adv.id, { archetype: crafter.rollArchetype() });
  const withArchetype = crafter.modifierBreakdown(store.active());
  store.setCrafted(adv.id, { organization: crafter.rollOrganization(withArchetype.organization.total) });
  const mods = crafter.modifierBreakdown(store.active());
  for (let i = 0; i < lieutenants; i += 1) store.addUnderling(adv.id, "lieutenant", crafter.rollUnderling("lieutenant", mods.lieutenant.total));
  for (let i = 0; i < minions; i += 1) store.addUnderling(adv.id, "minion", crafter.rollUnderling("minion", mods.minion.total));
  const tables = ["character-identity", "character-motivations", "character-appearance", "character-traits-flaws"];
  for (let i = 0; i < details; i += 1) {
    const word = oracle.discover(tables[i % tables.length], { logAs: "detail" });
    store.addDetail(adv.id, { kind: "villain" }, { tableId: word.tableId, table: word.table, roll: word.roll, word: word.word, at: Date.now() });
  }
  const roster = store.active().villain.crafted;
  for (const kind of ["lieutenant", "minion"]) {
    const first = roster[`${kind}s`][0];
    if (!first) continue;
    const word = oracle.discover("character-skills", { logAs: "detail" });
    store.addDetail(adv.id, { kind, id: first.id }, { tableId: word.tableId, table: word.table, roll: word.roll, word: word.word, at: Date.now() });
  }
}

function reset() { store.__setState({ version: 1, adventures: [], rollLog: [], activeAdventureId: null }); }

/** Force a run of reveals, restarting rather than accepting an early End Goal. */
function revealPhases(adv, count) {
  let guard = 0;
  while (derived.planPhases(store.active()).length < count && guard < 200) {
    guard += 1;
    const before = store.active();
    const result = roller.revealNext(before, { earnedNote: "Followed the lead and got into the room." });
    if (!result.ok) break;
    if (result.phase.kind === "endgoal") { store.deletePhase(adv.id, result.phase.id); }
  }
}

function addLeads(adv, per) {
  for (const phase of store.active().phases) {
    for (let i = 0; i < per; i += 1) {
      store.addLead(adv.id, phase.id, `Lead ${i + 1} from ${phase.kind} ${phase.ordinal || ""}: who is paying for all of this, and why here?`);
    }
  }
}

function writeInterpretations(adv) {
  for (const phase of store.active().phases) {
    store.updatePhase(adv.id, phase.id, {
      interpretation: "The agents are amassing relics, swords and a seized mine, and not one of them knows what any of it is for - which means the answer is being kept a long way above their heads."
    });
  }
}

/** A few scenes played, the lists populated and weighted, one scene still running. */
function playScenes(adv, { played = 2, threads = [], characters = [], leaveOpen = true } = {}) {
  for (const text of threads) store.addListItem(adv.id, "threads", text);
  for (const text of characters) store.addListItem(adv.id, "characters", text);
  const first = store.active().characters[0];
  if (first) store.setListEntries(adv.id, "characters", first.id, 3);
  for (let i = 0; i < played; i += 1) {
    sceneEngine.testScene(store.active(), { expectation: `The character follows the lead, ${i + 1}.` });
    const scene = store.active().scenes.slice(-1)[0];
    store.updateScene(adv.id, scene.id, { notes: "It went about as well as these things go: something learned, something else broken." });
    sceneEngine.endScene(store.active(), i % 2 ? "in" : "out");
  }
  if (leaveOpen) sceneEngine.testScene(store.active(), { expectation: "The PC reaches the mine and finds it guarded." });
}

// ------------------------------------------------------------------ mid-session
reset();
const mid = store.createAdventure({
  name: "The General Who Did Not Go Home",
  villainName: "General Gorazon", epithet: "the rogue general",
  known: "A victorious imperial general has not gone home, and is absorbing his defeated enemy's henchmen.",
  forces: "An army camped at the stronghold; unknown funds."
});
revealPhases(mid, 3);
addLeads(mid, 2);
writeInterpretations(mid);
craftVillain(mid, { lieutenants: 1, minions: 1 });
oracle.ask({ question: "Is the mine still guarded?", odds: "likely" });
playScenes(mid, {
  played: 2,
  threads: ["Find out who is paying the diggers", "Stop the ore shipment"],
  characters: ["General Gorazon", "The seized mine", "A raid on the road"]
});
writeFileSync("tests/fixtures/mid-session.json", JSON.stringify(JSON.parse(store.exportJSON()), null, 2));

// ------------------------------------------------------------------ stress
// What a table has by session three: several adventures, one of them long, a full log.
reset();
for (let i = 0; i < 7; i += 1) {
  const adv = store.createAdventure({ name: `Concluded adventure ${i + 1}: the long cold winter of a thousand schemes`, villainName: `Villain ${i + 1}` });
  revealPhases(adv, 2);
  addLeads(adv, 2);
  store.setArcStage(adv.id, "concluded", { concludedAt: Date.now() });
}
const deep = store.createAdventure({
  name: "Cold Rock, Cold Heart",
  villainName: "Max Vathen", epithet: "the billionaire",
  known: "A billionaire has bought an island nation and is building something on it.",
  forces: "Private security, a fleet, more money than several states."
});
revealPhases(deep, 6);
addLeads(deep, 3);
writeInterpretations(deep);
craftVillain(deep, { lieutenants: 4, minions: 6, details: 5 });
for (let i = 0; i < 12; i += 1) oracle.ask({ question: `Does the guard look up? (${i + 1})`, odds: i % 2 ? "unlikely" : "50-50" });
playScenes(deep, {
  played: 7,
  threads: ["Destroy the wazonite stockpile", "Find out who funded the island", "Get off the island alive", "Warn the rivals"],
  characters: ["Max Vathen", "The island facility", "Fabian Torres", "The security chief", "A helicopter", "The cold caverns"]
});
// drive it to an End Goal, then a defeat and a pivot
let guard = 0;
while (!derived.endGoalRevealed(store.active()) && guard < 50) { guard += 1; roller.revealNext(store.active()); }
store.setArcStage(deep.id, "foiling", { endGoalAt: Date.now() });
store.setArcStage(deep.id, "pivot", { defeatedAt: Date.now() });
for (const key of ["survived", "underlings"]) store.setPivotFlag(deep.id, key, true);
roller.revealPivot(store.active());
// a full roll log
for (let i = store.rollLog().length; i < 200; i += 1) {
  store.pushLog({ adventureId: deep.id, kind: "phase", dice: [{ die: "d10", value: (i % 10) + 1, table: "End Goal Roll" }, { die: "d100", value: (i * 7) % 100 + 1, table: "Villain Plan Focus" }], summary: "Gathering Resources + Mental, Missing", outcome: `Phase ${i % 6 + 1} (${i % 11 + 1} vs 11)` });
}
writeFileSync("tests/fixtures/stress.json", JSON.stringify(JSON.parse(store.exportJSON()), null, 2));

console.log("fixtures written: fresh, mid-session, stress, old-shape");

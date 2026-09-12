// Shared by every unit file: the modules under test, loaded once, and the fixtures
// and helpers the sections built up. installStorage() runs before any module is
// imported, because store.js touches localStorage the moment it is loaded.
import { readdirSync } from "node:fs";
import { installStorage } from "../harness.mjs";
installStorage();

export const SHIPPED = [
  "data.js", "data-library.js", "firebase-config.js", "service-worker.js",
  ...readdirSync("src").filter((f) => f.endsWith(".js")).map((f) => `src/${f}`)
];

export const DATA_FILES = readdirSync(".").filter((f) => /^data.*\.js$/.test(f));
export const DATA_MODULES = Object.fromEntries(await Promise.all(DATA_FILES.map(async (f) => [f, await import(`../../${f}`)])));
export const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
export const data = await import("../../data.js");
export const rules = await import("../../src/rules.js");
export const derived = await import("../../src/derived.js");
export const store = await import("../../src/store.js");
export const roller = await import("../../src/roller.js");
export const lifecycle = await import("../../src/lifecycle.js");
export const mythic = await import("../../data-mythic.js");
export const oracle = await import("../../src/oracle.js");
export const sceneData = await import("../../data-scenes.js");
export const fate = await import("../../data-fate-chart.js");
export const actions = await import("../../data-actions.js");
export const sceneEngine = await import("../../src/scene-engine.js");
export const check = await import("../../data-fate-check.js");
export const elements = await import("../../data-elements.js");
export const vc = await import("../../data-villain-crafter.js");
export const crafter = await import("../../src/crafter.js");
export const rulesEarly = await import("../../src/rules.js");

export function advWith(phaseCount) {
  return derived.normalizeAdventure({
    name: "t",
    phases: Array.from({ length: phaseCount }, () => ({ kind: "phase", focus: null, keywords: [] }))
  });
}

export function freshAdventure(name = "Test adventure") {
  store.__setState({ version: 1, adventures: [], rollLog: [], activeAdventureId: null });
  return store.createAdventure({ name, villainName: "The General" });
}

export function atPivot(flags = {}) {
  const adv = freshAdventure();
  store.addPhase(adv.id, { id: "eg", kind: "endgoal", focus: null, keywords: [], leads: [] });
  store.setArcStage(adv.id, "pivot", {});
  for (const [k, v] of Object.entries(flags)) store.setPivotFlag(adv.id, k, v);
  return store.active();
}

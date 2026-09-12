// unit: dead-data scan
import { readFileSync } from "node:fs";
import { test, assert } from "../harness.mjs";
import { SHIPPED, data, rules, roller } from "./shared.mjs";

// ---------------------------------------------------------------- dead-data scan
test("dead-data scan: every export is imported somewhere (§11.2.1)", () => {
  const files = SHIPPED.filter((f) => f !== "service-worker.js");
  const bodies = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  const allowed = new Set([
    "firebaseConfig", "FIREBASE_ENABLED",   // Phase 5 shape, deliberately unconsumed (§1.1)
    "__setState",                            // test seam, named as one
    "rollKeywords",                          // engine API the unit harness exercises directly
    "fateLadder", "opmChart",                // the chart's two cross-checks, harness-only
    // The Crafter's engine and its screen share one module, so these have no importer
    // outside it; the harness drives them directly and every one has a test.
    "rollArchetype", "rollOrganization", "rollUnderling",
    "modifierBreakdown", "canRollOrganization", "canRollUnderling",
    // The scene engine and its screens share one module, as the Crafter's do.
    "testScene", "endScene", "interruptEvent", "rollAdjustments", "rollFromList",
    "routes",                                // the layout probe's single source of routes
    "die", "d10", "d100",                    // dice primitives, reached through the roller
    "clearNode", "clearUndo", "deepClone",
    "FOCUS_TABLES"                           // the table roster the harness iterates
  ]);
  const dead = [];
  for (const [file, body] of bodies) {
    const names = [];
    for (const m of body.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) names.push(m[1]);
    for (const m of body.matchAll(/export\s+(?:const|let|class)\s+(\w+)/g)) names.push(m[1]);
    for (const m of body.matchAll(/export\s*\{([^}]+)\}/g)) for (const part of m[1].split(",")) names.push(part.trim().split(/\s+as\s+/).pop());
    for (const name of names) {
      if (allowed.has(name)) continue;
      const used = [...bodies].some(([other, text]) => other !== file && new RegExp(`\\b${name}\\b`).test(text));
      if (!used) dead.push(`${file}: ${name}`);
    }
  }
  assert(dead.length === 0, `exported but never imported:\n    ${dead.join("\n    ")}`);
});

test("dead-data scan: every rules table reaches a consumer", () => {
  const bodies = SHIPPED.map((f) => readFileSync(f, "utf8")).join("\n");
  for (const name of ["VILLAIN_PLAN_FOCUS", "END_GOAL_FOCUS", "PIVOT_PLAN_FOCUS", "PLOT_TWISTS",
    "END_GOAL_ROLL", "PIVOT_GATE", "ARC_STAGES", "GUIDANCE", "NOT_IN_SOURCE", "LOG_CAP", "SOURCE"]) {
    const uses = bodies.split(name).length - 1;
    assert(uses >= 2, `${name} is declared but never read`);
  }
});

test("every guidance entry is surfaced somewhere", () => {
  const ui = ["src/sheet.js", "src/screens.js", "src/wizard.js", "src/tutorial.js"].map((f) => readFileSync(f, "utf8")).join("\n");
  for (const key of Object.keys(data.GUIDANCE)) {
    assert(ui.includes(`"${key}"`), `GUIDANCE.${key} is never shown`);
  }
});

test("every library entry id linked from the UI exists", () => {
  const ui = ["src/sheet.js", "src/screens.js", "src/wizard.js", "src/tutorial.js"].map((f) => readFileSync(f, "utf8")).join("\n");
  const ids = new Set(rules.libraryGroups().flatMap((g) => g.entries).map((e) => e.id));
  const linked = [...ui.matchAll(/citeLink\("([\w-]+)"/g)].map((m) => m[1]);
  assert(linked.length > 0, "the UI links to the library at all");
  for (const id of linked) assert(ids.has(id), `citeLink points at a missing entry: ${id}`);
});

test("the service worker caches every shipped file", () => {
  const sw = readFileSync("service-worker.js", "utf8");
  for (const file of SHIPPED.filter((f) => f !== "service-worker.js")) {
    assert(sw.includes(`./${file}`), `${file} is missing from the app shell`);
  }
  assert(!sw.includes("./tests/"), "dev-only harnesses stay out of the shell");
});

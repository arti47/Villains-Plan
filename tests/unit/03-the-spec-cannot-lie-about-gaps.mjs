// unit: the spec cannot lie about gaps
import { readFileSync, readdirSync } from "node:fs";
import { test, assert } from "../harness.mjs";
import { rulesEarly, data, rules, derived } from "./shared.mjs";

// ---------------------------------------------------------------- the spec cannot lie about gaps
// F45 twice over: the data-side gap lists were asserted, and the PROSE that describes
// them drifted anyway - CLAUDE.md §1.2 named two closed gaps for a whole source. So the
// prose is asserted too: the canonical line is derived from the data, and no "still not
// supplied" passage may name a subsystem that ships.
test("CLAUDE.md and docs/rules say the same thing about gaps as the data does", () => {
  const gaps = [...rulesEarly.notSupplied(), ...rulesEarly.stillNotInSource()];
  const spec = readFileSync("CLAUDE.md", "utf8");
  const canonical = gaps.length
    ? `**Unsupplied (asserted by the harness):** ${gaps.length}`
    : "**Unsupplied (asserted by the harness):** none.";
  assert(spec.includes(canonical), `CLAUDE.md must carry the line "${canonical}" - it is derived from the data`);
  const shipped = ["Fate Chart", "Event Focus", "Scene Adjustment", "Thread Progress Track", "Villain Crafter",
    "Chaos Factor", "scene setup", "Bookkeeping", "Mid-Chaos", "Low-Chaos", "Fate Check", "Track \\+1",
    "Strengthen Progress", "Discovery Check", "Threads and Characters", "Elements"];
  const docs = readdirSync("docs/rules").map((f) => `docs/rules/${f}:\n${readFileSync(`docs/rules/${f}`, "utf8")}`);
  for (const text of [`CLAUDE.md:\n${spec}`, ...docs]) {
    const name = text.slice(0, text.indexOf(":"));
    // a passage runs from a "still not supplied" line to the next heading, blank lines
    // included - the first version stopped at the first blank line and so only ever read
    // the headings themselves, which is why it was verified by planting a stale sentence
    const passages = text.match(/still (not|un)[- ]?(supplied|sourced|in|taken)[^\n]*\n[\s\S]*?(?=\n#|$(?![\s\S]))/gi) || [];
    for (const passage of passages) {
      for (const sub of shipped) {
        assert(!new RegExp(`${sub}[^.]{0,80}(not (yet )?(built|supplied|implemented|in)|remain|still (missing|un))`, "i").test(passage),
          `${name} still says ${sub.replace("\\", "")} is missing: "${passage.trim().slice(0, 120)}..."`);
      }
    }
  }
});

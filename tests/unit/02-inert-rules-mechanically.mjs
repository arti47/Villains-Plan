// unit: inert rules, mechanically
import { readFileSync, readdirSync } from "node:fs";
import { test, equal } from "../harness.mjs";
import { DATA_MODULES, data, rules } from "./shared.mjs";

// ---------------------------------------------------------------- inert rules, mechanically
// The §0 defect class: data extracted, tested, documented - and never read. The dead-data
// scan sees exports; this sees FIELDS. Every key in every data export must be read
// somewhere in src/, by property access, destructuring or a quoted string. Harness-only
// cross-checks are allowed by name; nothing else is. It is a floor, not a ceiling - a key
// that is also a common word can slip past it - but it is what found F51-F53.

test("every field of every data export is read by src/ (the mechanical read-through)", () => {
  const src = readdirSync("src").map((f) => readFileSync(`src/${f}`, "utf8")).join("\n");
  const HARNESS_ONLY = ["FATE_LADDER", "FATE_LADDER_OFFSETS", "VARIANT_EQUIVALENCE"];
  const META = new Set(["provenance", "cite", "provisional"]);   // read by tests and docs, not the app
  const unread = [];
  const seen = new Set();
  const lookupKeys = new Set();   // every row's `key` value: a map keyed by these is read by lookup
  const walk = (obj, path, depth) => {
    if (depth > 3 || !obj || typeof obj !== "object") return;
    if (typeof obj.key === "string") lookupKeys.add(obj.key);
    for (const [k, v] of Object.entries(obj)) {
      if (/^\d+$/.test(k)) { walk(v, path, depth + 1); continue; }
      if (!seen.has(k) && !META.has(k)) {
        seen.add(k);
        if (!new RegExp(`[.\\[\\s"'{,]${k}\\b`).test(src)) unread.push({ path: `${path}.${k}`, k });
      }
      walk(v, `${path}.${k}`, depth + 1);
    }
  };
  for (const [file, mod] of Object.entries(DATA_MODULES)) {
    for (const [name, val] of Object.entries(mod)) {
      if (HARNESS_ONLY.includes(name)) continue;
      walk(val, `${file}:${name}`, 0);
    }
  }
  const dead = unread.filter((u) => !lookupKeys.has(u.k)).map((u) => u.path);
  equal(dead.length, 0, `data fields nothing in src/ reads:\n    ${dead.join("\n    ")}`);
});

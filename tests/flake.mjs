// Runs the unit suite repeatedly and reports any test that fails in any run. Three of
// this project's defects were flakes between 4% and 13% - invisible to one green run,
// obvious to twenty (docs/AUDIT.md F46, F49). Usage: node tests/flake.mjs [runs]
import { execFileSync } from "node:child_process";

const runs = Number(process.argv[2]) || 20;
const seen = new Map();
for (let i = 0; i < runs; i += 1) {
  let out = "";
  try { out = execFileSync(process.execPath, ["tests/unit.mjs"], { encoding: "utf8", stdio: "pipe" }); }
  catch (err) { out = `${err.stdout || ""}${err.stderr || ""}`; }
  for (const line of out.split("\n")) {
    const m = line.match(/^\s+FAIL\s+(.+)$/);
    if (m) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  }
}
if (seen.size) {
  console.log(`flake: ${seen.size} test(s) failed in ${runs} runs`);
  for (const [name, n] of seen) console.log(`  ${n}/${runs}  ${name}`);
  process.exit(1);
}
console.log(`flake: ${runs} consecutive clean runs`);

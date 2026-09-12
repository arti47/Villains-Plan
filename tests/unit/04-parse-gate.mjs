// unit: parse gate
import { execFileSync } from "node:child_process";
import { test } from "../harness.mjs";
import { SHIPPED, check } from "./shared.mjs";

// ---------------------------------------------------------------- parse gate
// A missing paren presents as a screen that never renders, not as a thrown error.
// This check costs a second and has already caught two (docs/AUDIT.md F1).
for (const file of SHIPPED) {
  test(`parses: ${file}`, () => {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  });
}

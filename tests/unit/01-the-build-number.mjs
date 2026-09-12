// unit: the build number
import { readFileSync } from "node:fs";
import { test, assert, equal } from "../harness.mjs";

// ---------------------------------------------------------------- the build number
// F48: the app caches itself, so the version on screen is the only way to tell whether
// the code in front of you is the code that shipped. A build number that drifts from the
// cache it names is worse than none at all.
test("the build number on screen is the cache version that shipped", () => {
  const sw = readFileSync("service-worker.js", "utf8");
  const core = readFileSync("src/core.js", "utf8");
  const cache = sw.match(/CACHE_VERSION\s*=\s*"([^"]+)"/);
  const build = core.match(/build:\s*"([^"]+)"/);
  assert(cache, "service-worker.js declares a CACHE_VERSION");
  assert(build, "core.js declares APP.build");
  equal(build[1], cache[1], "APP.build must equal CACHE_VERSION");
});

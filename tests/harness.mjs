// Shared test scaffolding: assertions and a browser-free environment for the modules.

export const results = { pass: 0, fail: 0, failures: [] };

export function test(name, fn) {
  try {
    const out = fn();
    // F54: an async test returns a promise, the try sees no throw, and it was counted as
    // a pass whatever happened inside it. Unit tests are synchronous by contract; hoist
    // any `await import()` to the top level of the file.
    if (out && typeof out.then === "function") {
      throw new Error("this test is async, and the harness cannot see whether it passed - make it synchronous");
    }
    results.pass += 1;
  }
  catch (err) { results.fail += 1; results.failures.push({ name, message: err.message }); }
}

export function assert(cond, message) { if (!cond) throw new Error(message || "assertion failed"); }
export function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message || "equal"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
export function deepEqual(actual, expected, message) {
  const a = JSON.stringify(actual); const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message || "deepEqual"}:\n  expected ${b}\n  got      ${a}`);
}
export function throws(fn, message) {
  try { fn(); } catch { return; }
  throw new Error(message || "expected a throw");
}

/** localStorage shim so store.js runs outside a browser. */
export function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear()
  };
  return globalThis.localStorage;
}

export function report(label) {
  const { pass, fail, failures } = results;
  for (const f of failures) console.error(`  FAIL  ${f.name}\n        ${f.message}`);
  console.log(`${label}: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

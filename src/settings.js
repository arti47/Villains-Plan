// settings.js — feature flags and display preferences (CLAUDE.md §8).
// Every flag: a getter, a setter, and a default that follows the fiction (§10.15).

const KEY = "schemer.settings.v1";
const DEFAULTS = {
  theme: "system",     // "system" | "light" | "dark"
  textScale: 1,        // pays back the zoom lock (§6.2)
  showGuidance: true,  // the book's own advice on the reveal card; on by default because
                       // the article's whole method is interpretation guidance (§10.15)
  mythicOracle: true   // Ask The Game Master, Random Events and Discover Meaning. On by
                       // default: the Villain's Plan procedure asks Fate Questions itself,
                       // so off would mean a rule that never fires. Turn it off if you run
                       // the oracle with physical dice or another emulator.
};

let cache = null;

function load() {
  if (cache) return cache;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { raw = null; }
  cache = { ...DEFAULTS, ...(raw && typeof raw === "object" ? raw : {}) };
  return cache;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* private mode: keep in memory */ }
}

export const Settings = {
  all: () => ({ ...load() }),
  get: (k) => load()[k],
  set(k, v) { load(); cache[k] = v; save(); apply(); return v; },
  reset() { cache = { ...DEFAULTS }; save(); apply(); },
  defaults: () => ({ ...DEFAULTS }),

  theme: () => load().theme,
  textScale: () => load().textScale,
  showGuidance: () => load().showGuidance !== false,
  mythicOracle: () => load().mythicOracle !== false
};

/** Push display settings onto the document. Idempotent. */
export function apply() {
  const s = load();
  const root = document.documentElement;
  if (s.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", s.theme);
  root.style.setProperty("--text-scale", String(s.textScale || 1));
}

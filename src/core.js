// core.js — constants, DOM helpers, dice. No imports (CLAUDE.md §6.1).

export const APP = { name: "Schemer", tagline: "a villain's plan, one layer at a time", storeKey: "schemer.v1" };

// ---------------------------------------------------------------- dice
// Cryptographic source only. Math.random is banned app-wide (§5.1) and the unit
// harness greps every shipped file for it.
function randomBelow(n) {
  if (!Number.isInteger(n) || n < 1) throw new Error("randomBelow needs a positive integer");
  const limit = Math.floor(0x100000000 / n) * n; // rejection sampling: no modulo bias
  const buf = new Uint32Array(1);
  let v;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
  return v % n;
}

/** Roll one die with `sides` faces. Returns 1..sides. */
export function die(sides) { return randomBelow(sides) + 1; }
export const d10 = () => die(10);
export const d100 = () => die(100);

// ---------------------------------------------------------------- ids & time
export function uid(prefix = "id") {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return `${prefix}_${buf[0].toString(36)}${buf[1].toString(36)}`;
}
export const now = () => Date.now();

export function formatDate(ts) {
  if (!ts) return "";
  const dt = new Date(ts);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
export function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------- DOM
/**
 * Null-safe element factory. Nullish children are skipped, so
 * el("div", {}, maybe && node) never renders the text "null" (§13 D-1).
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = String(v);
    else if (k === "html") node.innerHTML = v;
    else if (k === "dataset") for (const [dk, dv] of Object.entries(v)) { if (dv !== null && dv !== undefined) node.dataset[dk] = dv; }
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, String(v));
  }
  add(node, ...children);
  return node;
}

/** Append children, skipping nullish ones. Use this for every conditional append. */
export function add(parent, ...children) {
  for (const child of children.flat(4)) {
    if (child === null || child === undefined || child === false || child === "") continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------------------------------------------------------------- misc
export function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
export function deepClone(value) { return value === undefined ? value : JSON.parse(JSON.stringify(value)); }
/** Escape nothing, truncate for display. */
export function truncate(text, max = 120) {
  const s = String(text || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

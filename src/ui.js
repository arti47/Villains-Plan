// ui.js — themed primitives. No native alert/confirm/prompt anywhere (§5).
// Modal actions are ordered primary-first, everywhere, without exception (§6.4).

import { el, add, clear, $ } from "./core.js";

let openModal = null;

function modalRoot() {
  let root = $("#modal-root");
  if (!root) { root = el("div", { id: "modal-root" }); document.body.append(root); }
  return root;
}

/**
 * Accessible modal. `actions` are rendered primary-first.
 * Returns { close } and resolves focus back to the invoking element.
 */
export function modal({ title, body, actions = [], onClose, size = "" }) {
  if (openModal) openModal.close({ silent: true });
  const restoreTo = document.activeElement;

  const card = el("div", { class: `modal-card ${size}`, role: "document" });
  const heading = el("h2", { class: "modal-title", id: "modal-title", text: title || "" });
  const content = el("div", { class: "modal-body" });
  add(content, body);

  const bar = el("div", { class: "modal-actions" });
  const buttons = actions.map((a, i) => el("button", {
    class: `btn ${a.kind === "danger" ? "btn-danger" : i === 0 ? "btn-primary" : "btn-quiet"}`,
    type: "button",
    onclick: () => { const keep = a.onClick && a.onClick(); if (!keep) close(); }
  }, a.label));
  add(bar, ...buttons);

  add(card, heading, content, actions.length ? bar : null);
  const overlay = el("div", {
    class: "modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title",
    onclick: (e) => { if (e.target === overlay) close(); }
  }, card);

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const focusables = Array.from(card.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter((n) => !n.disabled && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0]; const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function close(opts = {}) {
    if (openModal !== handle) return;
    document.removeEventListener("keydown", onKey, true);
    overlay.remove();
    openModal = null;
    document.body.classList.remove("modal-open");
    if (restoreTo && restoreTo.focus) restoreTo.focus();
    if (onClose && !opts.silent) onClose();
  }

  const handle = { close, card };
  openModal = handle;
  document.addEventListener("keydown", onKey, true);
  document.body.classList.add("modal-open");
  modalRoot().append(overlay);
  const focusTarget = card.querySelector("input, textarea, select") || buttons[0] || card;
  if (focusTarget.focus) focusTarget.focus();
  return handle;
}

export function showToast(message, kind = "") {
  let region = $("#toast-region");
  if (!region) {
    region = el("div", { id: "toast-region", class: "toast-region", role: "status", "aria-live": "polite" });
    document.body.append(region);
  }
  const toast = el("div", { class: `toast ${kind}`, text: message });
  region.append(toast);
  setTimeout(() => toast.classList.add("toast-out"), 3200);
  setTimeout(() => toast.remove(), 3800);
  return toast;
}

/** Destructive confirmations name the loss (§6.4) — `loss` is required by convention. */
export function confirmModal({ title, message, loss, confirmLabel = "Confirm", onConfirm, danger = true }) {
  const body = el("div", {});
  add(body, el("p", { text: message }), loss ? el("p", { class: "loss", text: loss }) : null);
  return modal({
    title,
    body,
    actions: [
      { label: confirmLabel, kind: danger ? "danger" : "primary", onClick: () => { onConfirm && onConfirm(); } },
      { label: "Cancel" }
    ]
  });
}

export function promptModal({ title, message, label, value = "", placeholder = "", multiline = false, confirmLabel = "Save", onConfirm }) {
  const field = multiline
    ? el("textarea", { id: "prompt-field", rows: 5, placeholder })
    : el("input", { id: "prompt-field", type: "text", placeholder });
  field.value = value;
  const body = el("div", {});
  add(body,
    message ? el("p", { text: message }) : null,
    el("label", { class: "field" }, el("span", { class: "field-label", text: label || "" }), field));
  return modal({
    title,
    body,
    actions: [
      { label: confirmLabel, onClick: () => { onConfirm && onConfirm(field.value); } },
      { label: "Cancel" }
    ]
  });
}

/**
 * The per-screen "what this does" note (§6.6). Collapsed by default, two to four
 * sentences, in the app's own voice.
 */
export function explain(text, extra) {
  const wrap = el("details", { class: "explain" });
  add(wrap, el("summary", { text: "What this screen does" }), el("p", { text }), extra || null);
  return wrap;
}

/** A link into the rules library, expanded and scrolled to (§6.6 layer 2). */
export function citeLink(entryId, label = "the rule") {
  return el("a", { class: "cite", href: `#/rules?entry=${encodeURIComponent(entryId)}` }, label);
}

function sourceCite(cite) {
  return cite ? el("span", { class: "source-cite", text: cite }) : null;
}

/**
 * The pinned primary action plus its spacer, returned together so a caller cannot
 * forget the spacer (§6.2).
 */
export function actionBar({ label, context, onClick, disabled = false, secondary = null, reason = null }) {
  const bar = el("div", { class: "action-bar" });
  const main = el("div", { class: "action-bar-main" });
  add(main,
    context ? el("span", { class: "action-context", text: context }) : null,
    el("button", {
      class: "btn btn-primary btn-action", type: "button", disabled: disabled || undefined,
      "aria-describedby": reason ? "action-reason" : null,
      onclick: onClick
    }, label));
  add(bar, main,
    secondary || null,
    reason ? el("p", { class: "action-reason", id: "action-reason", text: reason }) : null);
  const spacer = el("div", { class: "action-bar-spacer", "aria-hidden": "true" });
  return { bar, spacer, nodes: [spacer, bar] };
}

/** A labelled option row: the whole row is the tap target (§6.3.10). */
export function checkRow({ label, checked, onChange, hint }) {
  const input = el("input", { type: "checkbox", checked: checked || undefined, onchange: (e) => onChange(e.target.checked) });
  const row = el("label", { class: "check-row" });
  add(row, input, el("span", { class: "check-label" }, el("span", { text: label }), hint ? el("small", { text: hint }) : null));
  return row;
}

export function definitionRow(label, value) {
  const row = el("div", { class: "def-row" });
  add(row, el("span", { class: "def-label", text: label }), el("span", { class: "def-value" }, value));
  return row;
}
export function inlineRow(label, value) {
  const row = el("div", { class: "inline-row" });
  add(row, el("span", { class: "inline-label", text: label }), el("span", { class: "inline-value" }, value));
  return row;
}

export function sectionTitle(text, cite) {
  const h = el("h3", { class: "section-title" });
  add(h, text, sourceCite(cite));
  return h;
}

export function emptyState(message, actionLabel, href) {
  const box = el("div", { class: "empty" });
  add(box, el("p", { text: message }), actionLabel ? el("a", { class: "btn btn-primary", href }, actionLabel) : null);
  return box;
}

/** A die face, shown individually — never just a total (§5.1). */
export function diePill({ die, value, table }) {
  const pill = el("span", { class: "die", title: table ? `${die} on ${table}` : die });
  add(pill, el("span", { class: "die-kind", text: die }), el("span", { class: "die-value", text: String(value) }));
  return pill;
}

export function card(children, cls = "") {
  const box = el("section", { class: `card ${cls}` });
  add(box, children);
  return box;
}

export function clearNode(node) { return clear(node); }

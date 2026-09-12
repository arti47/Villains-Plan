// main.js — boot.

import { start } from "./router.js";
import { apply as applySettings, Settings } from "./settings.js";
import * as store from "./store.js";
import { showToast } from "./ui.js";
import { migrationReport } from "./store.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("service-worker.js").then((reg) => {
    reg.addEventListener("updatefound", () => {
      const incoming = reg.installing;
      if (!incoming) return;
      incoming.addEventListener("statechange", () => {
        if (incoming.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    });
    // An installed app can stay open for days. Ask again on every return to it, or the
    // only update check ever made is the one at first load.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) reg.update().catch(() => {});
    });
  }).catch(() => { /* offline install is best-effort */ });
}

/**
 * The update notice does NOT time out. It used to be an ordinary toast, gone in 3.2
 * seconds, which meant missing it left you running old code with no way to know
 * (docs/AUDIT.md F48) - the failure mode being a fix that appears not to have worked.
 */
function showUpdateToast() {
  const toast = showToast("A new version is ready. Tap to reload.", "update", { sticky: true });
  toast.style.cursor = "pointer";
  toast.setAttribute("role", "alert");
  toast.addEventListener("click", () => location.reload());
}

function boot() {
  applySettings();
  store.load();
  const repairs = migrationReport();
  if (repairs.length) console.info("Schemer: normalisation repaired", repairs);
  start();
  registerServiceWorker();
  // Theme follows the system unless the player has chosen (§6.2).
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (Settings.theme() === "system") applySettings();
    });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

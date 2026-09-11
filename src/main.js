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
  }).catch(() => { /* offline install is best-effort */ });
}

function showUpdateToast() {
  const toast = showToast("Update available - tap to reload", "update");
  toast.style.cursor = "pointer";
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

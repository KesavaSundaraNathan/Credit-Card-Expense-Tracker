import { initApp } from "./app.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("CardLedger: service worker registration failed.", err);
    });
  });
}

// Module scripts execute after the document has been parsed (like `defer`),
// so the DOM is already available here — no need to wait for DOMContentLoaded.
initApp();

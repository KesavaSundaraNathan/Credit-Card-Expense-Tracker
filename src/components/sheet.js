let backdrop, root, currentEl, onCloseCb;

function els() {
  if (!backdrop) backdrop = document.getElementById("sheet-backdrop");
  if (!root) root = document.getElementById("sheet-root");
  return { backdrop, root };
}

export function openSheet(innerHtml, { onMount, onClose, dismissible = true } = {}) {
  const { backdrop, root } = els();
  if (currentEl) closeSheet(true);

  const el = document.createElement("div");
  el.className = "sheet";
  el.innerHTML = `<div class="sheet-handle"></div>${innerHtml}`;
  root.appendChild(el);
  currentEl = el;
  onCloseCb = onClose;

  backdrop.classList.add("open");
  backdrop.onclick = dismissible ? () => closeSheet() : null;

  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));

  if (onMount) onMount(el);
  return el;
}

export function closeSheet(instant) {
  const { backdrop } = els();
  backdrop.classList.remove("open");
  backdrop.onclick = null;
  if (!currentEl) return;
  const el = currentEl;
  currentEl = null;
  const cb = onCloseCb;
  onCloseCb = null;

  if (instant) {
    el.remove();
    if (cb) cb();
    return;
  }
  el.classList.remove("open");
  setTimeout(() => el.remove(), 280);
  if (cb) cb();
}

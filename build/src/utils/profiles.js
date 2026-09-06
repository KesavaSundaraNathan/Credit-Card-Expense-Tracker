import { uid } from "./id.js";
import { periodContaining, periodToRecord, today } from "./date.js";

export function getActiveProfile(state) {
  return state.profiles[state.activeProfileId] || state.profiles.primary;
}

/** Moves the active profile forward/back through profileOrder (wraps around). dir: 1 or -1 */
export function cycleProfile(state, dir) {
  const order = state.profileOrder;
  if (order.length <= 1) return getActiveProfile(state);
  const idx = order.indexOf(state.activeProfileId);
  const nextIdx = (idx + dir + order.length) % order.length;
  state.activeProfileId = order[nextIdx];
  return getActiveProfile(state);
}

export function createProfile(state, { name, heading, startDay, currency }) {
  const id = uid();
  const cleanStartDay = Math.min(31, Math.max(1, parseInt(startDay, 10) || 1));
  const profile = {
    id,
    isPrimary: false,
    name: (name || "").trim() || "New Profile",
    heading: (heading || "").trim() || null,
    onboarded: true,
    settings: { startDay: cleanStartDay, currency: (currency || "$").trim() || "$" },
    currentPeriod: periodToRecord(periodContaining(today(), cleanStartDay)),
    currentExpenses: [],
    budgets: {},
    log: [],
  };
  state.profiles[id] = profile;
  state.profileOrder.push(id);
  state.activeProfileId = id;
  return profile;
}

export function renameProfile(state, id, name) {
  const p = state.profiles[id];
  if (!p || p.isPrimary) return;
  const clean = (name || "").trim();
  if (clean) p.name = clean;
}

export function setProfileHeading(state, id, heading) {
  const p = state.profiles[id];
  if (!p || p.isPrimary) return;
  const clean = (heading || "").trim();
  p.heading = clean || null;
}

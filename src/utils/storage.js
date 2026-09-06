const KEY_V2 = "cardledger:v2";
const KEY_V1 = "cardledger:v1"; // earlier single-profile shape, kept around for migration only

function defaultProfileShape(overrides = {}) {
  return {
    id: "profile",
    isPrimary: false,
    name: "Profile",
    heading: null, // custom heading override for Bill/Table views; null = use default label
    onboarded: true,
    settings: { startDay: 1, currency: "$" },
    currentPeriod: null,
    currentExpenses: [],
    budgets: {},
    log: [],
    ...overrides,
  };
}

function defaultState() {
  const primary = defaultProfileShape({
    id: "primary",
    isPrimary: true,
    name: "Expense Tracker",
    heading: null,
    onboarded: false,
  });
  return {
    version: 2,
    theme: "system", // global UI preference, not per-profile
    activeProfileId: "primary",
    profileOrder: ["primary"],
    profiles: { primary },
  };
}

function mergeProfile(base, incoming) {
  return {
    ...base,
    ...incoming,
    settings: { ...base.settings, ...(incoming.settings || {}) },
    budgets: { ...(incoming.budgets || {}) },
    currentExpenses: Array.isArray(incoming.currentExpenses) ? incoming.currentExpenses : [],
    log: Array.isArray(incoming.log) ? incoming.log : [],
  };
}

function mergeWithDefaults(parsed) {
  const d = defaultState();
  const profiles = { primary: d.profiles.primary };

  if (parsed.profiles && typeof parsed.profiles === "object") {
    for (const [id, p] of Object.entries(parsed.profiles)) {
      const base = id === "primary" ? d.profiles.primary : defaultProfileShape({ id, name: p.name || "Profile" });
      profiles[id] = mergeProfile(base, p);
      profiles[id].isPrimary = id === "primary";
    }
  }

  let profileOrder = Array.isArray(parsed.profileOrder) && parsed.profileOrder.length
    ? parsed.profileOrder.filter((id) => profiles[id])
    : Object.keys(profiles);
  if (!profileOrder.includes("primary")) profileOrder.unshift("primary");

  return {
    version: 2,
    theme: parsed.theme || d.theme,
    activeProfileId: profiles[parsed.activeProfileId] ? parsed.activeProfileId : "primary",
    profileOrder,
    profiles,
  };
}

function migrateFromV1(legacy) {
  const d = defaultState();
  const primary = d.profiles.primary;
  primary.onboarded = !!legacy.onboarded;
  primary.settings.startDay = legacy.settings?.startDay ?? 1;
  primary.settings.currency = legacy.settings?.currency ?? "$";
  primary.currentPeriod = legacy.currentPeriod || null;
  primary.currentExpenses = Array.isArray(legacy.currentExpenses) ? legacy.currentExpenses : [];
  primary.budgets = legacy.budgets || {};
  primary.log = Array.isArray(legacy.log) ? legacy.log : [];
  d.theme = legacy.settings?.theme || "system";
  return d;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY_V2);
    if (raw) return mergeWithDefaults(JSON.parse(raw));

    const legacyRaw = localStorage.getItem(KEY_V1);
    if (legacyRaw) {
      const migrated = migrateFromV1(JSON.parse(legacyRaw));
      saveState(migrated);
      return migrated;
    }

    return defaultState();
  } catch (e) {
    console.error("Expense Tracker: failed to load state, starting fresh.", e);
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Expense Tracker: failed to save state.", e);
    return false;
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY_V2);
    localStorage.removeItem(KEY_V1);
    return true;
  } catch (e) {
    return false;
  }
}

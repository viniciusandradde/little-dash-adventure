const KEY = "little-dash-adventure-save";

const EMPTY = {
  schemaVersion: 1,
  selectedCharacter: "cubinho",
  soundEnabled: true,
  stars: 0,
  completedLevels: [],
  lastPlayedLevel: "candy-0"
};

export function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || parsed.schemaVersion !== 1) return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...progress, schemaVersion: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  localStorage.removeItem(KEY);
  return { ...EMPTY };
}

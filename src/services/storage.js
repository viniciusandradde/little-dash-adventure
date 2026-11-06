import { RATING, WORLDS } from "../config.js";

export const STORAGE_KEY = "little-dash-adventure-save";
export const SCHEMA_VERSION = 2;

export const DEFAULT_SETTINGS = Object.freeze({
  sound: true,
  music: true,
  challengeMode: false,
  reducedMotion: false
});

export function emptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    selectedCharacter: "cubinho",
    settings: { ...DEFAULT_SETTINGS },
    levels: {},
    lastPlayedLevel: "candy-0",
    legacyStars: 0
  };
}

export function emptyLevelRecord() {
  return { completed: false, plays: 0, bestStars: 0, bestRating: 0, coins: [false, false, false], noHit: false, bestTime: null, attempts: 0 };
}

/** Converts any previously stored payload into the current schema. */
export function migrate(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  if (raw.schemaVersion === SCHEMA_VERSION) {
    return {
      ...base,
      ...raw,
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
      levels: Object.fromEntries(Object.entries(raw.levels ?? {}).map(([id, record]) => [id, { ...emptyLevelRecord(), ...record, coins: Array.isArray(record.coins) ? [...record.coins] : [false, false, false] }]))
    };
  }
  if (raw.schemaVersion === 1) {
    const levels = {};
    for (const id of raw.completedLevels ?? []) levels[id] = { ...emptyLevelRecord(), completed: true, plays: 1, bestRating: 1 };
    return {
      ...base,
      selectedCharacter: raw.selectedCharacter ?? base.selectedCharacter,
      settings: { ...DEFAULT_SETTINGS, sound: raw.soundEnabled !== false, music: raw.soundEnabled !== false },
      levels,
      lastPlayedLevel: raw.lastPlayedLevel ?? base.lastPlayedLevel,
      legacyStars: Number(raw.stars) || 0
    };
  }
  return base;
}

function storage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function loadProgress() {
  try {
    const store = storage();
    const parsed = store ? JSON.parse(store.getItem(STORAGE_KEY) || "null") : null;
    return migrate(parsed);
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(STORAGE_KEY, JSON.stringify({ ...progress, schemaVersion: SCHEMA_VERSION }));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  try { storage()?.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return emptyProgress();
}

export function computeRating(stars, totalStars) {
  const ratio = totalStars > 0 ? stars / totalStars : 1;
  if (ratio >= RATING.threeStarsRatio) return 3;
  if (ratio >= RATING.twoStarsRatio) return 2;
  return 1;
}

/** Applies a finished run to the progress object and returns what changed. */
export function recordResult(progress, result) {
  const record = { ...emptyLevelRecord(), ...(progress.levels[result.levelId] ?? {}) };
  const rating = computeRating(result.stars, result.totalStars);
  const previousCoins = [...record.coins];
  const coins = record.coins.map((had, index) => had || Boolean(result.coins[index]));
  const firstCompletion = !record.completed;
  const isNewBest = result.stars > record.bestStars;
  const next = {
    ...record,
    completed: true,
    plays: record.plays + 1,
    attempts: record.attempts + (result.attempts ?? 1),
    bestStars: Math.max(record.bestStars, result.stars),
    bestRating: Math.max(record.bestRating, rating),
    coins,
    noHit: record.noHit || result.hits === 0,
    bestTime: record.bestTime === null ? result.time : Math.min(record.bestTime, result.time)
  };
  progress.levels = { ...progress.levels, [result.levelId]: next };
  progress.lastPlayedLevel = result.levelId;
  const newCoins = coins.map((has, index) => has && !previousCoins[index]);
  return { rating, newCoins, isNewBest, firstCompletion, record: next, stickerUnlocked: coins.every(Boolean) && !previousCoins.every(Boolean) };
}

export function levelRecord(progress, levelId) {
  return { ...emptyLevelRecord(), ...(progress.levels[levelId] ?? {}) };
}

export function isStickerUnlocked(progress, levelId) {
  return levelRecord(progress, levelId).coins.every(Boolean);
}

export function summarize(progress) {
  const records = Object.values(progress.levels);
  const totalStars = records.reduce((sum, record) => sum + (record.bestStars ?? 0), 0);
  const totalCoins = records.reduce((sum, record) => sum + record.coins.filter(Boolean).length, 0);
  const completedLevels = records.filter((record) => record.completed).length;
  const ratingSum = records.reduce((sum, record) => sum + (record.bestRating ?? 0), 0);
  const stickers = Object.keys(progress.levels).filter((id) => isStickerUnlocked(progress, id)).length;
  return { totalStars, totalCoins, completedLevels, ratingSum, stickers, maxRating: WORLDS.length * 3 * 3 };
}

export function worldSummary(progress, worldId) {
  const world = WORLDS.find((item) => item.id === worldId);
  if (!world) return { rating: 0, maxRating: 0, completed: 0, coins: 0 };
  let rating = 0, completed = 0, coins = 0;
  world.levels.forEach((_, index) => {
    const record = levelRecord(progress, `${worldId}-${index}`);
    rating += record.bestRating;
    completed += record.completed ? 1 : 0;
    coins += record.coins.filter(Boolean).length;
  });
  return { rating, maxRating: world.levels.length * 3, completed, coins, maxCoins: world.levels.length * 3 };
}

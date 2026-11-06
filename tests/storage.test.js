import test from "node:test";
import assert from "node:assert/strict";
import { migrate, recordResult, computeRating, summarize, worldSummary, emptyProgress, loadProgress, saveProgress, STORAGE_KEY } from "../src/services/storage.js";

test("migrates a version 1 save without losing the child's progress", () => {
  const legacy = { schemaVersion: 1, selectedCharacter: "dino", soundEnabled: false, stars: 42, completedLevels: ["candy-0", "candy-1"], lastPlayedLevel: "candy-1" };
  const progress = migrate(legacy);
  assert.equal(progress.schemaVersion, 2);
  assert.equal(progress.selectedCharacter, "dino");
  assert.equal(progress.settings.sound, false);
  assert.equal(progress.settings.challengeMode, false);
  assert.equal(progress.legacyStars, 42);
  assert.equal(progress.levels["candy-0"].completed, true);
  assert.equal(progress.levels["candy-0"].bestRating, 1);
  assert.equal(progress.lastPlayedLevel, "candy-1");
});

test("unknown or corrupt payloads fall back to an empty save", () => {
  assert.deepEqual(migrate(null), emptyProgress());
  assert.deepEqual(migrate("garbage"), emptyProgress());
  assert.equal(migrate({ schemaVersion: 99 }).schemaVersion, 2);
});

test("ratings follow the collected-star ratio", () => {
  assert.equal(computeRating(0, 60), 1);
  assert.equal(computeRating(30, 60), 2);
  assert.equal(computeRating(50, 60), 3);
  assert.equal(computeRating(0, 0), 3);
});

test("recording a result keeps the best values and never removes coins", () => {
  const progress = emptyProgress();
  const first = recordResult(progress, { levelId: "candy-0", stars: 20, totalStars: 60, coins: [true, false, false], hits: 2, attempts: 1, time: 50 });
  assert.equal(first.firstCompletion, true);
  assert.equal(first.rating, 1);
  assert.deepEqual(first.newCoins, [true, false, false]);
  const second = recordResult(progress, { levelId: "candy-0", stars: 50, totalStars: 60, coins: [false, true, true], hits: 0, attempts: 1, time: 48 });
  assert.equal(second.firstCompletion, false);
  assert.equal(second.isNewBest, true);
  assert.equal(second.rating, 3);
  assert.equal(second.stickerUnlocked, true);
  const record = progress.levels["candy-0"];
  assert.deepEqual(record.coins, [true, true, true]);
  assert.equal(record.bestStars, 50);
  assert.equal(record.bestRating, 3);
  assert.equal(record.noHit, true);
  assert.equal(record.plays, 2);
  assert.equal(record.bestTime, 48);
  const summary = summarize(progress);
  assert.equal(summary.totalCoins, 3);
  assert.equal(summary.stickers, 1);
  assert.equal(worldSummary(progress, "candy").rating, 3);
});

test("save and load round-trip through localStorage when available", () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const progress = emptyProgress();
  progress.selectedCharacter = "foguetinho";
  assert.equal(saveProgress(progress), true);
  assert.ok(memory.has(STORAGE_KEY));
  assert.equal(loadProgress().selectedCharacter, "foguetinho");
  delete globalThis.localStorage;
});

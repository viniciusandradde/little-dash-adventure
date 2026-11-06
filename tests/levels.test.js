import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevel, getNextLevel, MUSIC } from "../src/game/levels.js";
import { WORLDS, CHARACTERS, PHYSICS } from "../src/config.js";

test("catalog contains twelve levels with three per world", () => {
  assert.equal(LEVELS.length, 12);
  for (const world of WORLDS) {
    assert.equal(LEVELS.filter((level) => level.worldId === world.id).length, 3);
    assert.ok(MUSIC[world.id].bpm > 0);
  }
});

test("level identifiers are unique, stable and ordered", () => {
  const ids = LEVELS.map((level) => level.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(getLevel("candy-0").id, "candy-0");
  assert.equal(getLevel("missing").id, LEVELS[0].id);
  assert.equal(getNextLevel("candy-0").id, "candy-1");
  assert.equal(getNextLevel("candy-2").id, "dino-0");
  assert.equal(getNextLevel("space-2"), null);
});

test("four playable characters are configured", () => {
  assert.equal(CHARACTERS.length, 4);
  assert.equal(new Set(CHARACTERS.map((character) => character.id)).size, 4);
});

test("every level has a finish line, three checkpoints, three coins and plenty of stars", () => {
  for (const level of LEVELS) {
    assert.equal(level.entities.filter((entity) => entity.type === "finish").length, 1, level.id);
    assert.equal(level.totalCoins, 3, level.id);
    assert.equal(level.checkpoints.length, 3, level.id);
    assert.ok(level.totalStars >= 40, `${level.id} has ${level.totalStars} stars`);
    assert.ok(level.finishX < level.length);
  }
});

test("levels last between 35 and 75 seconds at normal speed", () => {
  for (const level of LEVELS) {
    const seconds = level.finishX / PHYSICS.speeds.normal;
    assert.ok(seconds >= 35 && seconds <= 75, `${level.id} lasts ${seconds.toFixed(0)}s`);
  }
});

test("entities are sorted and every jump is physically possible", () => {
  const airTime = (2 * -PHYSICS.jumpVelocity) / PHYSICS.gravity;
  const jumpHeight = (PHYSICS.jumpVelocity ** 2) / (2 * PHYSICS.gravity);
  for (const level of LEVELS) {
    for (let i = 1; i < level.entities.length; i++) assert.ok(level.entities[i].x >= level.entities[i - 1].x, `${level.id} unsorted`);
    for (const gap of level.entities.filter((entity) => entity.type === "gap")) {
      assert.ok(gap.w < airTime * PHYSICS.speeds.slow - PHYSICS.playerSize * 0.5, `${level.id} gap too wide: ${gap.w}`);
    }
    for (const block of level.entities.filter((entity) => entity.type === "block" && !entity.floating)) {
      assert.ok(block.h <= jumpHeight + 2, `${level.id} block too tall: ${block.h}`);
    }
  }
});

test("the beat grid changes with the world's tempo", () => {
  const candy = getLevel("candy-0");
  const space = getLevel("space-0");
  assert.equal(candy.bpm, MUSIC.candy.bpm);
  assert.notEqual(candy.bpm, space.bpm);
});

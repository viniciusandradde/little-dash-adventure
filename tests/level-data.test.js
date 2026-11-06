import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevel } from "../src/game/level-data.js";
import { WORLDS, CHARACTERS } from "../src/config.js";

test("catalog contains twelve levels with three per world", () => {
  assert.equal(LEVELS.length, 12);
  for (const world of WORLDS) {
    assert.equal(LEVELS.filter((level) => level.worldId === world.id).length, 3);
  }
});

test("level identifiers are unique and stable", () => {
  const ids = LEVELS.map((level) => level.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(getLevel("candy-0").id, "candy-0");
});

test("unknown level falls back to the first configured level", () => {
  assert.equal(getLevel("missing").id, LEVELS[0].id);
});

test("four playable characters are configured", () => {
  assert.equal(CHARACTERS.length, 4);
  assert.equal(new Set(CHARACTERS.map((character) => character.id)).size, 4);
});


test("difficulty progresses gradually across all twelve adventures", () => {
  assert.equal(LEVELS[0].obstacleSpacing, 620);
  assert.equal(LEVELS.at(-1).obstacleSpacing, 480);
  for (let index = 1; index < LEVELS.length; index += 1) {
    assert.ok(LEVELS[index].obstacleSpacing <= LEVELS[index - 1].obstacleSpacing);
    assert.ok(LEVELS[index].obstacleSpacing >= 480);
  }
});

test("every level defines a readable obstacle cue and collectible star placement", () => {
  for (const level of LEVELS) {
    assert.ok(level.cueDistance >= 200);
    assert.ok(level.starLead > 0);
    assert.ok(level.firstObstacle > level.starLead);
    assert.equal(level.starCount, 5);
  }
});

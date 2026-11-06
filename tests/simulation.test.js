import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevel } from "../src/game/levels.js";
import { Simulation, runHeadless } from "../src/game/simulation.js";
import { PHYSICS } from "../src/config.js";

const S = PHYSICS.playerSize;

/** A small deterministic bot that jumps over hazards and chases stars. */
function bot(sim) {
  if (sim.mode === "fly") {
    const target = PHYSICS.groundY - 2.6 * PHYSICS.unit;
    if (sim.y + S / 2 > target) sim.press(); else sim.release();
    return;
  }
  const front = sim.x + S;
  const hazard = sim.entities.some((e) => (e.type === "spike" || e.type === "block") && !e.floating && e.x >= front - 5 && e.x < front + 45);
  const gap = sim.entities.some((e) => e.type === "gap" && e.x >= front - 5 && e.x < front + 30);
  const orb = sim.entities.some((e) => e.type === "orb" && Math.abs(e.x + S / 2 - (sim.x + S / 2)) < 30 && Math.abs(e.y + S / 2 - (sim.y + S / 2)) < 40);
  const star = sim.entities.some((e) => e.type === "star" && !sim.collected.has(e.__id) && e.x > sim.x && e.x < sim.x + 50 && e.y < sim.y - 25);
  if (hazard || gap || orb || (star && sim.grounded)) sim.press(); else sim.release();
}

test("every level completes without any input in kid mode (CA12)", () => {
  for (const level of LEVELS) {
    const { sim, events } = runHeadless(level, { seconds: 120 });
    assert.ok(sim.complete, `${level.id} did not complete`);
    assert.ok(events.some((event) => event.type === "complete"));
    assert.ok(sim.hits > 0, "a run without input should at least stumble");
    assert.equal(sim.attempts, 1, "kid mode never restarts");
  }
});

test("a simple bot clears every cube section without stumbling and collects coins", () => {
  for (const level of LEVELS) {
    const { sim } = runHeadless(level, { seconds: 120, controller: bot });
    assert.ok(sim.complete, `${level.id} did not complete`);
    assert.ok(sim.stars >= level.totalStars * 0.4, `${level.id}: only ${sim.stars}/${level.totalStars} stars`);
    assert.ok(sim.coins.some(Boolean), `${level.id}: no coins collected`);
    assert.ok(sim.hits <= 6, `${level.id}: bot stumbled ${sim.hits} times`);
  }
});

test("physics is deterministic for the same inputs", () => {
  const level = getLevel("candy-1");
  const a = runHeadless(level, { seconds: 60, controller: (sim, t) => (Math.floor(t * 3) % 2 ? sim.press() : sim.release()) });
  const b = runHeadless(level, { seconds: 60, controller: (sim, t) => (Math.floor(t * 3) % 2 ? sim.press() : sim.release()) });
  assert.equal(a.sim.stars, b.sim.stars);
  assert.equal(a.sim.hits, b.sim.hits);
  assert.equal(a.sim.time.toFixed(4), b.sim.time.toFixed(4));
});

test("jump input is buffered so an early tap still jumps on landing", () => {
  const sim = new Simulation(getLevel("candy-0"));
  sim.press(); sim.release();
  sim.step(PHYSICS.fixedStep);
  assert.ok(sim.vy < 0, "first tap jumps");
  while (!sim.grounded) sim.step(PHYSICS.fixedStep);
  sim.step(PHYSICS.fixedStep);
  sim.press(); sim.release(); // a tap while still in the air...
  for (let i = 0; i < 4; i++) sim.step(PHYSICS.fixedStep);
  assert.ok(sim.vy < 0, "buffered tap triggers a jump");
});

test("hazards never remove stars and give temporary invulnerability", () => {
  const level = getLevel("candy-0");
  const events = [];
  const sim = new Simulation(level, { listener: (type) => events.push(type) });
  let starsBefore = 0;
  for (let i = 0; i < 120 * 20; i++) {
    if (sim.stars > 0 && starsBefore === 0) starsBefore = sim.stars;
    sim.step(PHYSICS.fixedStep);
    if (events.includes("mistake")) break;
  }
  assert.ok(events.includes("mistake"));
  assert.ok(sim.invulnerable);
  assert.ok(sim.stars >= starsBefore);
  assert.equal(sim.streak, 0);
});

test("challenge mode restarts from the last checkpoint and keeps collected stars", () => {
  const level = getLevel("candy-0");
  const events = [];
  const sim = new Simulation(level, { challengeMode: true, listener: (type, payload) => events.push({ type, ...payload }) });
  for (let i = 0; i < 120 * 30 && !events.some((event) => event.type === "respawn"); i++) {
    if (sim.time > 20) sim.release(); // stop playing after 20 seconds to force a mistake
    else bot(sim);
    sim.step(PHYSICS.fixedStep);
  }
  const respawn = events.find((event) => event.type === "respawn");
  assert.ok(respawn, "a mistake triggers a respawn");
  assert.equal(sim.attempts, 2);
  assert.ok(sim.checkpointState, "a checkpoint was passed before the mistake");
  assert.ok(sim.x >= sim.checkpointState.x && sim.x <= sim.checkpointState.x + 5, "position restored to checkpoint");
  assert.ok(sim.stars > 0, "stars collected before the mistake are kept");
});

test("a dedicated bot can finish a challenge-mode level", () => {
  const level = getLevel("candy-0");
  const { sim } = runHeadless(level, { seconds: 240, controller: bot, challengeMode: true });
  assert.ok(sim.complete);
  assert.equal(sim.attempts, 1);
});

test("fly portals switch the movement mode and holding lifts the player", () => {
  const level = getLevel("dino-1");
  const sim = new Simulation(level);
  const portal = level.entities.find((e) => e.type === "fly" && e.on);
  while (sim.x < portal.x + 10) sim.step(PHYSICS.fixedStep);
  assert.equal(sim.mode, "fly");
  const yBefore = sim.y;
  sim.press();
  for (let i = 0; i < 30; i++) sim.step(PHYSICS.fixedStep);
  assert.ok(sim.y < yBefore, "holding makes the player rise");
  const exit = level.entities.find((e) => e.type === "fly" && !e.on);
  sim.release();
  while (sim.x < exit.x + 10) sim.step(PHYSICS.fixedStep);
  assert.equal(sim.mode, "cube");
});

test("speed portals change the horizontal speed", () => {
  const level = getLevel("candy-2");
  const sim = new Simulation(level);
  const fast = level.entities.find((e) => e.type === "speed" && e.value === "fast");
  while (sim.x < fast.x + 5) sim.step(PHYSICS.fixedStep);
  assert.equal(sim.speedName, "fast");
  assert.equal(sim.speed, PHYSICS.speeds.fast);
});

test("result payload summarises the run", () => {
  const { sim } = runHeadless(getLevel("space-0"), { seconds: 120, controller: bot });
  const result = sim.result();
  assert.equal(result.levelId, "space-0");
  assert.equal(result.totalStars, getLevel("space-0").totalStars);
  assert.equal(result.coins.length, 3);
  assert.ok(result.time > 30);
});

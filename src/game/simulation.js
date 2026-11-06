import { PHYSICS } from "../config.js";

const S = PHYSICS.playerSize;
const G = PHYSICS.groundY;
const TAU = Math.PI * 2;

const overlaps = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Pure, deterministic game simulation. It has no dependency on the DOM so it
 * runs identically in the browser, in tests and in a headless QA harness.
 *
 * Kid mode (default): every mistake is softened. Hazards bounce the player
 * over, pits catch them in a bubble, blocks lift them up. The adventure always
 * reaches the finish line, even without any input.
 *
 * Challenge mode: mistakes restart from the last checkpoint with an attempt
 * counter, giving older kids the real rhythm-platformer loop.
 */
export class Simulation {
  constructor(level, { challengeMode = false, listener = () => {} } = {}) {
    this.level = level;
    this.challengeMode = challengeMode;
    this.listener = listener;
    this.entities = level.entities;
    this.accumulator = 0;
    this.reset(false);
  }

  emit(type, payload = {}) { this.listener(type, { ...payload, time: this.time }); }

  reset(fromCheckpoint) {
    const checkpoint = fromCheckpoint ? this.checkpointState : null;
    this.time = checkpoint ? checkpoint.time : 0;
    this.x = checkpoint ? checkpoint.x : 0;
    this.y = G - S;
    this.vy = 0;
    this.speedName = checkpoint ? checkpoint.speedName : "normal";
    this.mode = checkpoint ? checkpoint.mode : "cube";
    this.grounded = true;
    this.rot = 0;
    this.squash = 0;
    this.inputHeld = false;
    this.pressBufferUntil = -1;
    this.lastGroundedAt = this.time;
    this.lastJumpAt = -1;
    this.invulnerableUntil = fromCheckpoint ? this.time + 0.5 : 0;
    this.bubbleUntil = 0;
    this.finished = false;
    this.finishedAt = 0;
    this.complete = false;
    this.hopTimer = 0;
    this.dustTimer = 0;
    this.cursor = 0;
    this.used = new Set();
    this.lastPadId = -1;
    this.lastOrbId = -1;
    this.particles = [];
    this.texts = [];
    this.shake = 0;
    this.flash = 0;
    this.comboPulse = 0;
    if (fromCheckpoint) {
      // Collected stars and coins are never taken away from the child.
      this.attempts += 1;
      this.streak = 0;
      return;
    }
    this.collected = new Set();
    this.stars = 0;
    this.coins = [false, false, false];
    this.hits = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.attempts = 1;
    this.checkpointIndex = -1;
    this.checkpointState = null;
  }

  get speed() { return PHYSICS.speeds[this.speedName]; }
  get progress() { return clamp(this.x / this.level.finishX, 0, 1); }
  get invulnerable() { return this.time < this.invulnerableUntil; }
  get isAirborne() { return !this.grounded; }

  // ---- input ----------------------------------------------------------
  press() {
    this.inputHeld = true;
    this.pressBufferUntil = this.time + PHYSICS.inputBuffer;
  }
  release() { this.inputHeld = false; }

  // ---- time -----------------------------------------------------------
  advance(seconds) {
    this.accumulator += Math.min(seconds, 0.25);
    let steps = 0;
    while (this.accumulator >= PHYSICS.fixedStep && steps < PHYSICS.maxStepsPerFrame) {
      this.step(PHYSICS.fixedStep);
      this.accumulator -= PHYSICS.fixedStep;
      steps += 1;
    }
    if (steps === PHYSICS.maxStepsPerFrame) this.accumulator = 0;
  }

  step(dt) {
    if (this.complete) return;
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 3.2);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.comboPulse = Math.max(0, this.comboPulse - dt * 2.5);
    this.squash *= Math.max(0, 1 - dt * 9);

    const speed = this.finished ? this.speed * 0.55 : this.speed;
    const previousY = this.y;
    this.x += speed * dt;

    if (this.finished) {
      this.updateCelebration(dt);
    } else if (this.mode === "fly") {
      this.updateFly(dt);
    } else {
      this.updateCube(dt, previousY);
    }

    this.updateTriggers(previousY);
    this.updateParticles(dt);

    if (!this.finished && this.x >= this.level.finishX) {
      this.finished = true;
      this.finishedAt = this.time;
      this.mode = "cube";
      this.spawnConfetti();
      this.emit("finish", { stars: this.stars, coins: this.coins, hits: this.hits });
    }
    if (this.finished && this.time - this.finishedAt > 1.9) {
      this.complete = true;
      this.emit("complete", this.result());
    }
  }

  result() {
    return {
      levelId: this.level.id,
      stars: this.stars,
      totalStars: this.level.totalStars,
      coins: [...this.coins],
      hits: this.hits,
      attempts: this.attempts,
      bestStreak: this.bestStreak,
      time: this.time,
      challengeMode: this.challengeMode
    };
  }

  // ---- cube physics ---------------------------------------------------
  updateCube(dt, previousY) {
    const wantsJump = this.inputHeld || this.time <= this.pressBufferUntil;
    const canJump = this.grounded || this.time - this.lastGroundedAt < PHYSICS.coyoteTime;
    if (wantsJump && canJump && this.time - this.lastJumpAt > 0.08) this.jump(PHYSICS.jumpVelocity, "jump");

    this.vy += PHYSICS.gravity * dt;
    this.vy = Math.min(this.vy, 1400);
    this.y += this.vy * dt;

    const wasGrounded = this.grounded;
    this.grounded = false;
    const overGap = this.gapAt(this.x + S / 2);

    // Solid blocks and one-way platforms.
    for (const entity of this.nearby()) {
      if (entity.type !== "block" && entity.type !== "plat") continue;
      if (!(this.x + S > entity.x && this.x < entity.x + entity.w)) continue;
      const previousBottom = previousY + S;
      const bottom = this.y + S;
      if (this.vy >= 0 && previousBottom <= entity.y + 4 && bottom >= entity.y) {
        this.y = entity.y - S;
        this.vy = 0;
        this.land(wasGrounded);
        continue;
      }
      if (entity.type === "plat") continue;
      if (this.vy < 0 && previousY >= entity.y + entity.h - 4 && this.y <= entity.y + entity.h) {
        this.y = entity.y + entity.h;
        this.vy = 60;
        continue;
      }
      // Side collision with a wall.
      if (this.y + S > entity.y + 6 && this.y < entity.y + entity.h - 6 && this.x + S > entity.x && this.x < entity.x + 10) {
        this.wallHit(entity, wasGrounded);
      }
    }

    // Ground.
    if (!overGap && this.y + S >= G) {
      this.y = G - S;
      this.vy = 0;
      this.land(wasGrounded);
    } else if (overGap && this.y + S > G + 12 && this.time > this.bubbleUntil) {
      this.pitFall();
    }

    if (this.grounded) {
      this.lastGroundedAt = this.time;
      const target = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);
      this.rot += (target - this.rot) * Math.min(1, dt * 22);
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) { this.dustTimer = 0.09; this.spawn("dust", this.x + 4, G, 1); }
    } else {
      this.rot += dt * 6.2;
    }
    if (this.y < PHYSICS.ceilingY) { this.y = PHYSICS.ceilingY; this.vy = Math.max(this.vy, 0); }
  }

  jump(velocity, reason) {
    this.vy = velocity;
    this.grounded = false;
    this.lastJumpAt = this.time;
    this.pressBufferUntil = -1;
    this.squash = -0.6;
    this.spawn("dust", this.x + S / 2, this.y + S, 4);
    this.emit(reason);
  }

  land(wasGrounded) {
    this.grounded = true;
    if (!wasGrounded) {
      this.squash = 0.9;
      this.spawn("dust", this.x + S / 2, this.y + S, 5);
      this.emit("land");
    }
  }

  wallHit(entity, wasGrounded) {
    if (this.invulnerable) return;
    if (this.challengeMode) return this.respawn("wall");
    if (!entity.floating && entity.h <= PHYSICS.unit * 2.05) {
      this.y = entity.y - S;
      this.vy = 0;
      this.land(wasGrounded);
      this.mistake("Opa! Subiu!", entity.x, entity.y);
    } else {
      this.vy = PHYSICS.bounceVelocity;
      this.grounded = false;
      this.mistake("Quase!", this.x, this.y);
    }
  }

  pitFall() {
    if (this.challengeMode) return this.respawn("pit");
    this.vy = -880;
    this.bubbleUntil = this.time + 0.9;
    this.invulnerableUntil = this.time + PHYSICS.invulnerableTime;
    this.mistake("A bolha te salvou!", this.x, G - 40);
    this.emit("bubble");
  }

  // ---- fly physics ----------------------------------------------------
  updateFly(dt) {
    this.vy += (this.inputHeld ? PHYSICS.flyLift : PHYSICS.flyGravity) * dt;
    this.vy = clamp(this.vy, -PHYSICS.flyMaxVelocity, PHYSICS.flyMaxVelocity);
    this.y += this.vy * dt;
    this.grounded = false;
    this.rot = clamp(this.vy / PHYSICS.flyMaxVelocity, -1, 1) * 0.45;
    const floor = G - S;
    if (this.y > floor) { this.y = floor; this.vy = Math.min(this.vy, 0); }
    if (this.y < PHYSICS.ceilingY) { this.y = PHYSICS.ceilingY; this.vy = Math.max(this.vy, 0); }
    this.dustTimer -= dt;
    if (this.dustTimer <= 0) { this.dustTimer = 0.05; this.spawn("trail", this.x, this.y + S / 2, 1); }

    for (const entity of this.nearby()) {
      if (entity.type !== "block" && entity.type !== "plat") continue;
      if (!overlaps(this.x + 5, this.y + 5, S - 10, S - 10, entity.x, entity.y, entity.w, entity.h)) continue;
      if (this.invulnerable) continue;
      if (this.challengeMode) return this.respawn("fly-wall");
      const centerY = this.y + S / 2;
      const entityCenter = entity.y + entity.h / 2;
      this.y = centerY < entityCenter ? entity.y - S - 2 : entity.y + entity.h + 2;
      this.vy = centerY < entityCenter ? -120 : 120;
      this.mistake("Quase!", this.x, this.y);
    }
  }

  // ---- triggers (hazards, pads, orbs, collectibles, portals) --------------
  updateTriggers(previousY) {
    const px = this.x + 6, py = this.y + 6, ps = S - 12;
    for (const entity of this.nearby()) {
      const id = entity.__id;
      switch (entity.type) {
        case "spike": {
          if (this.finished || this.invulnerable) break;
          const hx = entity.x + entity.w * 0.32, hw = entity.w * 0.36;
          const hy = entity.y + entity.h * 0.4, hh = entity.h * 0.6;
          if (overlaps(px, py, ps, ps, hx, hy, hw, hh)) this.hazardHit(entity);
          break;
        }
        case "pad": {
          if (this.lastPadId === id || this.mode === "fly") break;
          if (this.x + S > entity.x + 4 && this.x < entity.x + entity.w - 4 && this.y + S >= entity.y - 8 && this.y + S <= entity.y + entity.h + 10) {
            this.lastPadId = id;
            this.jump(PHYSICS.padVelocity, "pad");
            this.spawn("spark", entity.x + entity.w / 2, entity.y, 10);
            this.comboText("Uhuul!", entity.x, entity.y - 40);
          }
          break;
        }
        case "orb": {
          if (this.lastOrbId === id || this.mode === "fly") break;
          const dx = (this.x + S / 2) - (entity.x + entity.w / 2);
          const dy = (this.y + S / 2) - (entity.y + entity.h / 2);
          if (dx * dx + dy * dy < entity.r * entity.r * 1.3 && (this.inputHeld || this.time <= this.pressBufferUntil)) {
            this.lastOrbId = id;
            this.jump(PHYSICS.orbVelocity, "orb");
            this.spawn("spark", entity.x + entity.w / 2, entity.y + entity.h / 2, 12);
          }
          break;
        }
        case "star":
        case "coin": {
          if (this.collected.has(id)) break;
          const cx = entity.x + entity.w / 2, cy = entity.y + entity.h / 2;
          const dx = (this.x + S / 2) - cx, dy = (this.y + S / 2) - cy;
          const radius = entity.type === "coin" ? 34 : 30;
          if (dx * dx + dy * dy < radius * radius) {
            this.collected.add(id);
            if (entity.type === "star") {
              this.stars += 1;
              this.streak += 1;
              this.bestStreak = Math.max(this.bestStreak, this.streak);
              this.comboPulse = 1;
              this.spawn("spark", cx, cy, 6);
              if (this.streak > 0 && this.streak % 10 === 0) this.comboText(`${this.streak} seguidas!`, cx, cy - 30);
              this.emit("star", { stars: this.stars, streak: this.streak });
            } else {
              this.coins[entity.index] = true;
              this.spawn("spark", cx, cy, 18);
              this.comboText("Moeda secreta!", cx, cy - 34);
              this.emit("coin", { index: entity.index });
            }
          }
          break;
        }
        case "speed": {
          if (this.used.has(id)) break;
          if (this.x + S / 2 >= entity.x) {
            this.used.add(id);
            if (this.speedName !== entity.value) { this.speedName = entity.value; this.emit("speed", { value: entity.value }); }
          }
          break;
        }
        case "fly": {
          if (this.used.has(id)) break;
          if (this.x + S / 2 >= entity.x) {
            this.used.add(id);
            const mode = entity.on ? "fly" : "cube";
            if (this.mode !== mode) {
              this.mode = mode;
              this.vy = entity.on ? -120 : this.vy;
              this.spawn("spark", entity.x, entity.y + entity.h / 2, 14);
              this.emit("mode", { mode });
            }
          }
          break;
        }
        case "checkpoint": {
          if (this.used.has(id)) break;
          if (this.x >= entity.x) {
            this.used.add(id);
            this.checkpointIndex += 1;
            this.checkpointState = { x: entity.x, time: this.time, speedName: this.speedName, mode: this.mode };
            this.emit("checkpoint", { index: this.checkpointIndex });
          }
          break;
        }
        default:
          break;
      }
    }
  }

  hazardHit(entity) {
    if (this.challengeMode) return this.respawn("hazard");
    this.vy = this.mode === "fly" ? -260 : PHYSICS.bounceVelocity;
    this.grounded = false;
    this.mistake("Ops! Tente pular antes", entity.x, entity.y - 10);
    this.emit("bump");
  }

  mistake(text, x, y) {
    this.hits += 1;
    this.streak = 0;
    this.invulnerableUntil = this.time + PHYSICS.invulnerableTime;
    this.shake = 1;
    this.flash = 0.6;
    this.spawn("puff", this.x + S / 2, this.y + S / 2, 8);
    this.comboText(text, x, y, "soft");
    this.emit("mistake");
  }

  respawn(reason) {
    this.emit("respawn", { reason, attempts: this.attempts + 1 });
    this.shake = 1;
    this.flash = 0.8;
    this.reset(true);
  }

  updateCelebration(dt) {
    this.vy += PHYSICS.gravity * dt;
    this.y += this.vy * dt;
    if (this.y + S >= G) {
      this.y = G - S;
      this.vy = 0;
      this.grounded = true;
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) { this.hopTimer = 0.42; this.vy = -520; this.grounded = false; }
    }
    this.rot += dt * 7;
    if (Math.random() < dt * 24) this.spawn("confetti", this.x + Math.random() * 300 - 100, 10, 1);
  }

  // ---- helpers --------------------------------------------------------
  gapAt(worldX) {
    for (const entity of this.nearby()) {
      if (entity.type === "gap" && worldX > entity.x && worldX < entity.x + entity.w) return entity;
    }
    return null;
  }

  nearby() {
    const entities = this.entities;
    while (this.cursor < entities.length && entities[this.cursor].x + entities[this.cursor].w < this.x - 400) this.cursor += 1;
    const limit = this.x + 900;
    const result = [];
    for (let i = this.cursor; i < entities.length && entities[i].x < limit; i++) {
      if (entities[i].__id === undefined) entities[i].__id = i;
      result.push(entities[i]);
    }
    return result;
  }

  spawn(kind, x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const power = kind === "spark" ? 90 + Math.random() * 160 : kind === "confetti" ? 20 : 30 + Math.random() * 60;
      this.particles.push({
        kind, x, y,
        vx: kind === "dust" ? -60 - Math.random() * 60 : Math.cos(angle) * power,
        vy: kind === "dust" ? -20 - Math.random() * 40 : kind === "confetti" ? 60 + Math.random() * 90 : Math.sin(angle) * power - 40,
        life: 1, maxLife: kind === "confetti" ? 2.6 : kind === "trail" ? 0.5 : 0.55 + Math.random() * 0.3,
        size: kind === "spark" ? 3 + Math.random() * 3 : kind === "confetti" ? 5 + Math.random() * 4 : 4 + Math.random() * 5,
        spin: Math.random() * TAU, hue: Math.random()
      });
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  spawnConfetti() { this.spawn("confetti", this.x + 120, -10, 60); }

  comboText(text, x, y, kind = "good") {
    this.texts.push({ text, x, y, life: 1.3, kind });
    if (this.texts.length > 6) this.texts.shift();
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === "confetti" ? 40 : p.kind === "trail" ? 0 : 220) * dt;
      p.vx *= p.kind === "confetti" ? 0.995 : 0.98;
      p.spin += dt * 4;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= dt * 28;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }
}

/** Convenience helper used by tests and the QA harness. */
export function runHeadless(level, { seconds = 90, controller = null, challengeMode = false } = {}) {
  const events = [];
  const sim = new Simulation(level, { challengeMode, listener: (type, payload) => events.push({ type, ...payload }) });
  const dt = PHYSICS.fixedStep;
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps && !sim.complete; i++) {
    controller?.(sim, i * dt);
    sim.step(dt);
  }
  return { sim, events };
}

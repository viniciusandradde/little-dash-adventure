import { PHYSICS, WORLDS } from "../config.js";

/**
 * Level construction.
 *
 * Levels are written in BEATS, not pixels: every pattern advances a cursor
 * measured in musical beats and the builder converts it to world distance
 * with the current speed. That keeps the jumps on the rhythm of the music,
 * which is the heart of a "dash" game.
 */
const U = PHYSICS.unit;
const G = PHYSICS.groundY;

export const MUSIC = {
  candy: { bpm: 120 },
  dino: { bpm: 112 },
  ocean: { bpm: 100 },
  space: { bpm: 128 }
};

export function createRng(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  };
}

class LevelBuilder {
  constructor({ worldId, index, name, bpm, speed = "normal", seed }) {
    this.worldId = worldId;
    this.index = index;
    this.name = name;
    this.bpm = bpm;
    this.speedName = speed;
    this.entities = [];
    this.checkpoints = [];
    this.x = 0;
    this.rng = createRng(seed);
    this.coinsPlaced = 0;
    this.flying = false;
    this.advance(6);
  }

  get velocity() { return PHYSICS.speeds[this.speedName]; }
  get beat() { return this.velocity * 60 / this.bpm; }
  advance(beats) { this.x += beats * this.beat; return this; }
  at(beats = 0) { return this.x + beats * this.beat; }
  add(entity) { this.entities.push(entity); return this; }

  // ---- primitives -------------------------------------------------------
  spike(beats = 0, { height = 0 } = {}) {
    return this.add({ type: "spike", x: this.at(beats), y: G - height - U, w: U, h: U });
  }
  block(beats = 0, { h = 1, w = 1, lift = 0 } = {}) {
    return this.add({ type: "block", x: this.at(beats), y: G - (h + lift) * U, w: w * U, h: h * U });
  }
  platform(beats = 0, { lift = 2.6, w = 3 } = {}) {
    return this.add({ type: "plat", x: this.at(beats), y: G - lift * U, w: w * U, h: U * 0.5 });
  }
  gap(beats = 0, { w = 2.4 } = {}) {
    return this.add({ type: "gap", x: this.at(beats), y: G, w: w * U, h: U * 3 });
  }
  pad(beats = 0) { return this.add({ type: "pad", x: this.at(beats), y: G - U * 0.35, w: U, h: U * 0.35 }); }
  orb(beats = 0, { lift = 2.2 } = {}) {
    return this.add({ type: "orb", x: this.at(beats), y: G - lift * U - U / 2, w: U, h: U, r: U * 0.9 });
  }
  star(beats = 0, lift = 1.4) {
    return this.add({ type: "star", x: this.at(beats) + U * 0.25, y: G - lift * U - U * 0.5, w: U * 0.5, h: U * 0.5 });
  }
  coin(beats = 0, lift = 3.2) {
    this.coinsPlaced += 1;
    return this.add({ type: "coin", x: this.at(beats), y: G - lift * U - U * 0.5, w: U * 0.9, h: U * 0.9, index: this.coinsPlaced - 1 });
  }
  speed(name, beats = 0) {
    this.add({ type: "speed", x: this.at(beats), y: G - U * 3.6, w: U * 0.9, h: U * 3.6, value: name });
    this.speedName = name;
    return this;
  }
  fly(on, beats = 0) {
    this.add({ type: "fly", x: this.at(beats), y: G - U * 3.6, w: U * 0.9, h: U * 3.6, on });
    this.flying = on;
    return this;
  }
  floating(beats, lift, { w = 1, h = 1 } = {}) {
    return this.add({ type: "block", x: this.at(beats), y: G - lift * U - h * U, w: w * U, h: h * U, floating: true });
  }
  checkpoint(beats = 0) {
    const x = this.at(beats);
    this.checkpoints.push(x);
    this.add({ type: "checkpoint", x, y: G - U * 1.6, w: U * 0.6, h: U * 1.6 });
    return this.advance(2);
  }
  starArc(beats, count = 3, { lift = 1.6, spread = 1.1 } = {}) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const arcLift = lift + Math.sin(t * Math.PI) * 1.3;
      this.star(beats - spread / 2 + t * spread, arcLift);
    }
    return this;
  }
  starLine(beats, count = 3, lift = 1.2, step = 0.6) {
    for (let i = 0; i < count; i++) this.star(beats + i * step, lift);
    return this;
  }

  // ---- patterns (all measured in beats) ---------------------------------
  intro(label) {
    this.add({ type: "sign", x: this.at(0), y: G - U * 2.2, w: U * 2, h: U * 2, label });
    return this.advance(4);
  }
  breather(beats = 4, stars = true) {
    if (stars) this.starLine(1, Math.max(1, Math.floor(beats / 2)), 1.2, 1);
    return this.advance(beats);
  }
  singles(count = 3, every = 2) {
    for (let i = 0; i < count; i++) {
      this.spike(0);
      this.starArc(0.25, 3, { lift: 1.5 });
      this.advance(every);
    }
    return this.advance(1);
  }
  doubles(count = 2, every = 2.5) {
    for (let i = 0; i < count; i++) {
      this.spike(0); this.spike(0.42);
      this.starArc(0.45, 3, { lift: 1.7, spread: 1.3 });
      this.advance(every);
    }
    return this.advance(1);
  }
  triple() {
    this.spike(0); this.spike(0.34); this.spike(0.68);
    this.starArc(0.5, 3, { lift: 2, spread: 1.5 });
    return this.advance(3.5);
  }
  blockHop(count = 2, { h = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      this.block(0, { h, w: 1.5 });
      this.starArc(0.3, 3, { lift: h + 0.8 });
      this.advance(2.5);
    }
    return this.advance(0.5);
  }
  stairs() {
    this.block(0, { h: 1, w: 1.4 });
    this.block(1.1, { h: 2, w: 1.4 });
    this.block(2.2, { h: 3, w: 2.2 });
    this.star(0.3, 1.9); this.star(1.4, 2.9); this.star(2.5, 3.9); this.star(3.2, 3.9);
    this.coin(3.3, 5.2);
    return this.advance(5.5);
  }
  gapJump(count = 1, { w = 2.4 } = {}) {
    for (let i = 0; i < count; i++) {
      this.gap(0, { w });
      this.starArc(0.45, 3, { lift: 1.4 });
      this.advance(3);
    }
    return this;
  }
  platformRun(length = 4, { lift = 2.6 } = {}) {
    this.spike(0);
    this.platform(0.6, { lift, w: length });
    this.starLine(0.9, Math.max(2, Math.floor(length / 1.2)), lift + 0.8, 0.8);
    this.spike(0.9 + length * 0.55, {});
    return this.advance(length * 0.5 + 3.5);
  }
  padLaunch({ withCoin = false } = {}) {
    this.pad(0);
    this.platform(1.3, { lift: 3.4, w: 3 });
    this.star(1.5, 4.3); this.star(2, 4.3); this.star(2.5, 4.3);
    if (withCoin) this.coin(1.9, 5.6);
    this.spike(1.2); this.spike(1.62);
    return this.advance(5);
  }
  orbGap({ withCoin = false } = {}) {
    this.gap(0, { w: 3.4 });
    this.orb(0.75, { lift: 2.2 });
    this.starArc(1.6, 3, { lift: 2.4, spread: 1.4 });
    if (withCoin) this.coin(1.5, 5);
    return this.advance(4);
  }
  speedBurst(count = 3) {
    this.speed("fast");
    this.advance(2);
    for (let i = 0; i < count; i++) {
      this.spike(0);
      this.starArc(0.25, 2, { lift: 1.6, spread: 0.8 });
      this.advance(2);
    }
    this.speed("normal");
    return this.advance(2);
  }
  slowGroove(count = 3) {
    this.speed("slow");
    this.advance(2);
    for (let i = 0; i < count; i++) {
      this.spike(0); this.spike(0.42);
      this.starArc(0.45, 3, { lift: 1.7, spread: 1.2 });
      this.advance(2);
    }
    this.speed("normal");
    return this.advance(2);
  }
  flyCorridor(beats = 12, { withCoin = false, waves = 2 } = {}) {
    this.fly(true);
    this.advance(2);
    const start = this.x;
    for (let b = 0; b < beats; b += 1) {
      const t = b / beats;
      const lift = 2.4 + Math.sin(t * Math.PI * waves) * 1.5;
      if (b % 2 === 0) this.star(b, lift);
      if (b % 3 === 1) {
        const top = lift + 2.4;
        const bottom = lift - 2.4;
        if (bottom > 0.2) this.floating(b, 0, { w: 0.9, h: Math.max(0.5, bottom) });
        this.floating(b, top, { w: 0.9, h: Math.max(0.5, 7.2 - top) });
      }
    }
    if (withCoin) this.coin(beats * 0.5, 2.4 + Math.sin(0.5 * Math.PI * waves) * 1.5 + 1.2);
    this.x = start + beats * this.beat;
    this.advance(2);
    this.fly(false);
    return this.advance(2);
  }
  finale() {
    this.spike(0); this.spike(2); this.spike(4);
    this.starArc(0.25, 3, { lift: 1.5 }); this.starArc(2.25, 3, { lift: 1.5 }); this.starArc(4.25, 3, { lift: 1.5 });
    this.advance(7);
    this.add({ type: "finish", x: this.at(0), y: G - U * 4, w: U * 1.2, h: U * 4 });
    return this.advance(5);
  }

  build() {
    const finish = this.entities.find((entity) => entity.type === "finish");
    const sorted = [...this.entities].sort((a, b) => a.x - b.x);
    const stars = sorted.filter((entity) => entity.type === "star").length;
    const coins = sorted.filter((entity) => entity.type === "coin").length;
    return {
      id: `${this.worldId}-${this.index}`,
      worldId: this.worldId,
      index: this.index,
      name: this.name,
      bpm: this.bpm,
      length: this.x,
      finishX: finish?.x ?? this.x,
      entities: sorted,
      checkpoints: this.checkpoints,
      totalStars: stars,
      totalCoins: coins
    };
  }
}

function levelFactory(worldId, index, name, seed) {
  return new LevelBuilder({ worldId, index, name, bpm: MUSIC[worldId].bpm, seed });
}

/** Hand-crafted structure of the twelve adventures. */
const DESIGNS = {
  candy: [
    (b) => b.intro("Toque para pular!").singles(3, 2.5).breather(3).singles(4, 2).checkpoint().breather(2)
      .blockHop(2).breather(2).doubles(2).checkpoint().breather(2).stairs().breather(2)
      .singles(3, 2).padLaunch({ withCoin: true }).checkpoint().breather(2).gapJump(1).breather(2).singles(2, 2).coin(1, 1.4).advance(3).finale(),
    (b) => b.intro("Pulos duplos!").singles(2, 2).doubles(2).breather(2).blockHop(2, { h: 2 }).checkpoint()
      .platformRun(4).breather(2).gapJump(2).breather(1).padLaunch({ withCoin: true }).checkpoint()
      .doubles(3, 2.2).breather(2).orbGap({ withCoin: true }).breather(2).stairs().checkpoint().breather(2).triple().breather(2).finale(),
    (b) => b.intro("Vamos acelerar!").doubles(2).breather(2).speedBurst(3).checkpoint().breather(2).orbGap({ withCoin: true })
      .blockHop(3, { h: 1 }).checkpoint().platformRun(5, { lift: 3 }).breather(2).padLaunch({ withCoin: true }).checkpoint()
      .triple().breather(2).slowGroove(3).breather(2).gapJump(2, { w: 2.8 }).stairs().breather(2).finale()
  ],
  dino: [
    (b) => b.intro("Cuidado com os cactos!").singles(3, 2.2).breather(2).blockHop(2).checkpoint().breather(2).doubles(2)
      .breather(2).gapJump(2).checkpoint().breather(2).stairs().breather(2).singles(3, 2).padLaunch({ withCoin: true }).checkpoint()
      .breather(2).orbGap({ withCoin: true }).breather(3).finale(),
    (b) => b.intro("Hora de voar!").singles(2, 2).doubles(2).breather(2).checkpoint().flyCorridor(10, { withCoin: true, waves: 1 })
      .breather(2).blockHop(2, { h: 2 }).checkpoint().platformRun(4).breather(2).stairs().checkpoint().breather(2)
      .gapJump(2).breather(2).padLaunch({ withCoin: true }).breather(2).finale(),
    (b) => b.intro("Vulcão de Sorvete!").doubles(2).speedBurst(4).checkpoint().breather(2).orbGap({ withCoin: true })
      .blockHop(3, { h: 2 }).checkpoint().flyCorridor(14, { withCoin: true, waves: 2 }).breather(2).triple().checkpoint()
      .platformRun(5, { lift: 3 }).breather(2).stairs().breather(2).slowGroove(3).finale()
  ],
  ocean: [
    (b) => b.intro("Bolhas mágicas!").singles(3, 2.4).breather(2).doubles(2).checkpoint().breather(2).gapJump(2).breather(2)
      .blockHop(2).checkpoint().breather(2).padLaunch({ withCoin: true }).breather(2).stairs().checkpoint().breather(2)
      .orbGap({ withCoin: true }).breather(2).singles(3, 2).finale(),
    (b) => b.intro("Nade com a corrente!").doubles(2).breather(2).checkpoint().flyCorridor(12, { withCoin: true, waves: 2 })
      .breather(2).blockHop(3, { h: 1 }).checkpoint().platformRun(4).breather(2).speedBurst(3).checkpoint().breather(2)
      .stairs().breather(2).padLaunch({ withCoin: true }).breather(2).finale(),
    (b) => b.intro("Tesouro à frente!").speedBurst(3).breather(2).orbGap({ withCoin: true }).checkpoint().triple().breather(2)
      .flyCorridor(16, { withCoin: true, waves: 3 }).checkpoint().blockHop(3, { h: 2 }).breather(2).gapJump(2, { w: 2.8 })
      .checkpoint().stairs().breather(2).platformRun(6, { lift: 3 }).breather(2).slowGroove(4).finale()
  ],
  space: [
    (b) => b.intro("Gravidade lunar!").singles(3, 2.2).breather(2).blockHop(2).checkpoint().doubles(2).breather(2)
      .padLaunch({ withCoin: true }).checkpoint().breather(2).gapJump(2).breather(2).stairs().checkpoint().breather(2)
      .orbGap({ withCoin: true }).breather(2).singles(4, 2).finale(),
    (b) => b.intro("Anéis de Saturno!").doubles(2).breather(2).speedBurst(4).checkpoint().flyCorridor(14, { withCoin: true, waves: 2 })
      .breather(2).blockHop(3, { h: 2 }).checkpoint().platformRun(5, { lift: 3 }).breather(2).stairs().checkpoint()
      .breather(2).padLaunch({ withCoin: true }).breather(2).triple().finale(),
    (b) => b.intro("Estação final!").speedBurst(4).breather(2).triple().checkpoint().orbGap({ withCoin: true }).breather(2)
      .flyCorridor(18, { withCoin: true, waves: 3 }).checkpoint().blockHop(3, { h: 2 }).breather(2).speedBurst(5).checkpoint()
      .stairs().breather(2).gapJump(3, { w: 2.8 }).breather(2).platformRun(6, { lift: 3 }).breather(2).finale()
  ]
};

export const LEVELS = WORLDS.flatMap((world, worldIndex) =>
  world.levels.map((name, levelIndex) => {
    const builder = levelFactory(world.id, levelIndex, name, 1000 + worldIndex * 10 + levelIndex);
    DESIGNS[world.id][levelIndex](builder);
    return builder.build();
  })
);

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}

export function getNextLevel(id) {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1] : null;
}

export function getWorld(worldId) {
  return WORLDS.find((world) => world.id === worldId) ?? WORLDS[0];
}

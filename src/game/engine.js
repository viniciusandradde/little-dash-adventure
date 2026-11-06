import { Simulation } from "./simulation.js";
import { Renderer } from "./renderer.js";

/**
 * Browser wrapper around the pure simulation: owns the animation loop, the
 * canvas renderer and the input bindings. Everything game-related lives in
 * `Simulation`; everything pixel-related lives in `Renderer`.
 */
export class GameEngine {
  constructor(canvas, { level, world, character, challengeMode = false, reducedMotion = false, beatPhase = () => 0, onEvent = () => {} }) {
    this.canvas = canvas;
    this.level = level;
    this.world = world;
    this.character = character;
    this.reducedMotion = reducedMotion;
    this.beatPhase = beatPhase;
    this.onEvent = onEvent;
    this.renderer = new Renderer(canvas);
    this.sim = new Simulation(level, { challengeMode, listener: (type, payload) => this.handleEvent(type, payload) });
    this.running = false;
    this.paused = false;
    this.frameId = 0;
    this.lastTime = 0;
    this.timeScale = 1;
    this.clock = 0;
    this.hint = "Toque para pular!";
    this.resize = this.resize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("resize", this.resize);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.resize();
  }

  handleEvent(type, payload) {
    if (type === "jump" || type === "pad") this.hint = "";
    this.onEvent(type, payload, this.sim);
  }

  resize() { this.renderer.resize(); }

  start() {
    this.running = true;
    this.paused = false;
    this.lastTime = 0;
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }

  pause() { this.paused = true; this.sim.release(); }
  resume() { this.paused = false; this.lastTime = 0; }

  press() { if (this.running && !this.paused) this.sim.press(); }
  release() { this.sim.release(); }

  onPointerDown(event) { event.preventDefault(); this.press(); }
  onPointerUp() { this.release(); }
  onKeyDown(event) {
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); this.press(); }
  }
  onKeyUp(event) {
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") this.release();
  }

  loop(time) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 0;
    this.lastTime = time;
    this.clock += dt;
    if (!this.paused) this.sim.advance(dt * this.timeScale);
    this.renderer.draw(this.sim, {
      world: this.world,
      character: this.character,
      beat: this.beatPhase(),
      reducedMotion: this.reducedMotion,
      hint: this.hint,
      challengeMode: this.sim.challengeMode,
      time: this.clock
    });
    if (this.sim.complete) { this.running = false; return; }
    this.frameId = requestAnimationFrame((next) => this.loop(next));
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}

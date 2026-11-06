import { PHYSICS, THEMES } from "../config.js";
import { createRng } from "./levels.js";
import { drawCharacter, characterRotation } from "./characters.js";

const S = PHYSICS.playerSize;
const G = PHYSICS.groundY;
const VIEW_H = PHYSICS.viewHeight;
const TAU = Math.PI * 2;
const FONT = "'Baloo 2', 'Nunito', ui-rounded, system-ui, sans-serif";

const imageCache = new Map();
function loadImage(src) {
  if (!src) return null;
  if (!imageCache.has(src)) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    imageCache.set(src, image);
  }
  const image = imageCache.get(src);
  return image.complete && image.naturalWidth > 0 ? image : null;
}

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function star(ctx, cx, cy, outer, inner, points = 5, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rotation - Math.PI / 2 + i * Math.PI / points;
    const r = i % 2 ? inner : outer;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function label(ctx, text, x, y, size, { fill = "#fff", stroke = "#3b2f6b", align = "center", weight = 800 } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** Procedural mid-layer scenery, generated once per world from a seed. */
function buildScenery(worldId) {
  const rng = createRng(worldId.length * 977 + 13);
  const items = [];
  for (let i = 0; i < 160; i++) {
    items.push({ x: i * 150 + rng() * 90, kind: Math.floor(rng() * 4), size: 0.7 + rng() * 0.7, phase: rng() * TAU, tint: Math.floor(rng() * 4) });
  }
  return items;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.scenery = new Map();
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = Math.max(320, rect.width), cssH = Math.max(200, rect.height);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.scale = cssH / VIEW_H;
    this.viewW = cssW / this.scale;
    this.dpr = dpr;
  }

  sceneryFor(worldId) {
    if (!this.scenery.has(worldId)) this.scenery.set(worldId, buildScenery(worldId));
    return this.scenery.get(worldId);
  }

  draw(sim, options) {
    const { world, character, beat = 0, reducedMotion = false, hint = "", challengeMode = false, time = 0 } = options;
    const ctx = this.ctx;
    const theme = THEMES[world.id] ?? THEMES.candy;
    const viewW = this.viewW;
    const shake = reducedMotion ? 0 : sim.shake;
    const shakeX = Math.sin(time * 70) * shake * 5, shakeY = Math.cos(time * 90) * shake * 3;
    const camX = sim.x - viewW * PHYSICS.cameraAnchor;
    const pulse = reducedMotion ? 0 : Math.max(0, 1 - beat) ** 3;

    ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);
    this.drawSky(theme, world, camX, viewW, pulse);
    this.drawScenery(theme, world, camX, viewW, time, pulse);

    ctx.save();
    ctx.translate(-camX + shakeX, shakeY);
    this.drawGround(sim, theme, world, camX, viewW, pulse, time);
    this.drawEntities(sim, theme, world, camX, viewW, time, pulse);
    this.drawPlayer(sim, character, theme, time);
    this.drawParticles(sim, theme);
    this.drawTexts(sim);
    ctx.restore();

    if (sim.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(sim.flash * 0.35).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, VIEW_H);
    }
    this.drawHud(sim, theme, viewW, hint, challengeMode, time);
  }

  drawSky(theme, world, camX, viewW, pulse) {
    const ctx = this.ctx;
    const image = loadImage(world.background);
    ctx.fillStyle = theme.sky;
    ctx.fillRect(0, 0, viewW, VIEW_H);
    if (image) {
      const tileW = VIEW_H * (image.naturalWidth / image.naturalHeight);
      const offset = (camX * 0.12) % (tileW * 2);
      const first = Math.floor((offset - viewW) / tileW) - 1;
      for (let i = first; (i * tileW - offset) < viewW + tileW; i++) {
        const x = i * tileW - offset;
        if (x + tileW < 0 || x > viewW) continue;
        ctx.save();
        if (Math.abs(i) % 2 === 1) { ctx.translate(x + tileW, 0); ctx.scale(-1, 1); ctx.drawImage(image, 0, 0, tileW, VIEW_H); }
        else ctx.drawImage(image, x, 0, tileW, VIEW_H);
        ctx.restore();
      }
    }
    const haze = ctx.createLinearGradient(0, G - 150, 0, G);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(1, world.id === "space" ? "rgba(20,12,46,.45)" : "rgba(255,255,255,.28)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, G - 150, viewW, 150);
    if (pulse > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${(pulse * 0.07).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, VIEW_H);
    }
  }

  drawScenery(theme, world, camX, viewW, time, pulse) {
    const ctx = this.ctx;
    const items = this.sceneryFor(world.id);
    const parallax = 0.42;
    const left = camX * parallax - 120;
    const right = left + viewW + 240;
    ctx.save();
    ctx.globalAlpha = 0.82;
    for (const item of items) {
      if (item.x < left || item.x > right) continue;
      const x = item.x - camX * parallax;
      const base = G + 4;
      const size = item.size * (1 + pulse * 0.04);
      ctx.save();
      ctx.translate(x, base);
      ctx.scale(size, size);
      const color = theme.decor[item.tint];
      switch (world.id) {
        case "candy":
          if (item.kind === 0) { // lollipop
            ctx.fillStyle = "#fff"; rr(ctx, -3, -70, 6, 70, 3); ctx.fill();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -78, 22, 0, TAU); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -78, 12, 0, Math.PI * 1.5); ctx.stroke();
          } else if (item.kind === 1) { // cupcake
            ctx.fillStyle = "#d9a066"; rr(ctx, -20, -34, 40, 34, 6); ctx.fill();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -40, 24, Math.PI, 0); ctx.fill();
            ctx.fillStyle = "#ff5fa2"; ctx.beginPath(); ctx.arc(0, -62, 6, 0, TAU); ctx.fill();
          } else if (item.kind === 2) { // candy cane
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.arc(14, -60, 14, Math.PI, 0); ctx.stroke();
            ctx.strokeStyle = color; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.arc(14, -60, 14, Math.PI, 0); ctx.stroke(); ctx.setLineDash([]);
          } else { // gumdrop
            ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -16, 24, 18, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.ellipse(-8, -24, 7, 4, -0.5, 0, TAU); ctx.fill();
          }
          break;
        case "dino":
          if (item.kind === 0) { // palm
            ctx.strokeStyle = "#8a5a3c"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -50, 4, -92); ctx.stroke();
            ctx.fillStyle = "#4fae5c";
            for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(4, -92); ctx.rotate(-Math.PI / 2 + (k - 2) * 0.55 + Math.sin(time + item.phase) * 0.05); ctx.beginPath(); ctx.ellipse(22, 0, 26, 9, 0, 0, TAU); ctx.fill(); ctx.restore(); }
          } else if (item.kind === 1) { // fern bush
            ctx.fillStyle = color; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 12, -14 - Math.abs(k) * -6, 14, 22 - Math.abs(k) * 4, k * 0.25, 0, TAU); ctx.fill(); }
          } else if (item.kind === 2) { // egg
            ctx.fillStyle = "#fff7e0"; ctx.beginPath(); ctx.ellipse(0, -22, 17, 22, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(-6, -28, 4, 0, TAU); ctx.arc(7, -16, 5, 0, TAU); ctx.arc(2, -36, 3, 0, TAU); ctx.fill();
          } else { // hill
            ctx.fillStyle = "rgba(111,207,122,.7)"; ctx.beginPath(); ctx.ellipse(0, 10, 90, 48, 0, Math.PI, 0); ctx.fill();
          }
          break;
        case "ocean":
          if (item.kind === 0) { // seaweed
            ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round";
            for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 10, 0); for (let s = 1; s <= 5; s++) ctx.lineTo(k * 10 + Math.sin(time * 1.6 + item.phase + s) * 9, -s * 18); ctx.stroke(); }
          } else if (item.kind === 1) { // coral
            ctx.fillStyle = color; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.roundRect(k * 11 - 5, -30 - Math.abs(k) * -8, 10, 40 - Math.abs(k) * 8, 5); ctx.fill(); }
          } else if (item.kind === 2) { // bubbles
            ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2;
            for (let k = 0; k < 4; k++) { const by = -((time * 28 + k * 40 + item.phase * 20) % 220); ctx.beginPath(); ctx.arc(Math.sin(time + k) * 8, by, 4 + k * 1.5, 0, TAU); ctx.stroke(); }
          } else { // shell
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -4, 18, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(k * 7, -20); ctx.stroke(); }
          }
          break;
        default:
          if (item.kind === 0) { // planet
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -150, 22, 0, TAU); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -150, 36, 9, -0.3, 0, TAU); ctx.stroke();
          } else if (item.kind === 1) { // crystal cluster
            ctx.fillStyle = color; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 14 - 8, 0); ctx.lineTo(k * 14, -36 + Math.abs(k) * 10); ctx.lineTo(k * 14 + 8, 0); ctx.fill(); }
            ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -34); ctx.lineTo(2, 0); ctx.fill();
          } else if (item.kind === 2) { // satellite/station dome
            ctx.fillStyle = "#c6c0e6"; ctx.beginPath(); ctx.arc(0, -10, 26, Math.PI, 0); ctx.fill();
            ctx.fillStyle = "#8f87b3"; rr(ctx, -30, -12, 60, 12, 4); ctx.fill();
            ctx.fillStyle = "#ffe9a3"; ctx.beginPath(); ctx.arc(-9, -16, 4, 0, TAU); ctx.arc(9, -16, 4, 0, TAU); ctx.fill();
          } else { // twinkle
            ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.5 + Math.sin(time * 3 + item.phase) * 0.4; star(ctx, 0, -120 - item.phase * 20, 6, 2.5, 4, time * 0.5); ctx.fill();
          }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawGround(sim, theme, world, camX, viewW, pulse, time) {
    const ctx = this.ctx;
    const left = camX - 60, right = camX + viewW + 60;
    const gaps = sim.entities.filter((e) => e.type === "gap" && e.x + e.w > left && e.x < right);
    const segments = [];
    let cursor = left;
    for (const gap of gaps) { segments.push([cursor, gap.x]); cursor = gap.x + gap.w; }
    segments.push([cursor, right]);
    for (const gap of gaps) {
      const pit = ctx.createLinearGradient(0, G, 0, VIEW_H);
      pit.addColorStop(0, theme.pit); pit.addColorStop(1, theme.groundDark);
      ctx.fillStyle = pit; ctx.fillRect(gap.x, G, gap.w, VIEW_H - G);
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(gap.x, G, gap.w, 14);
    }
    for (const [a, b] of segments) {
      if (b <= a) continue;
      const w = b - a;
      ctx.fillStyle = theme.groundBody; ctx.fillRect(a, G, w, VIEW_H - G);
      const shade = ctx.createLinearGradient(0, G + 24, 0, VIEW_H);
      shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.35)");
      ctx.fillStyle = shade; ctx.fillRect(a, G + 24, w, VIEW_H - G - 24);
      ctx.fillStyle = theme.groundTop; ctx.fillRect(a, G, w, 12);
      ctx.fillStyle = theme.groundLine; ctx.globalAlpha = 0.75 + pulse * 0.25; ctx.fillRect(a, G, w, 3); ctx.globalAlpha = 1;
      const startTile = Math.floor(a / 48);
      for (let tx = startTile; tx * 48 < b; tx++) {
        const x = tx * 48;
        if (x + 48 < a) continue;
        const rng = createRng(tx * 7919 + world.id.length);
        switch (world.id) {
          case "candy":
            for (let k = 0; k < 4; k++) { ctx.fillStyle = theme.decor[k]; ctx.save(); ctx.translate(x + 6 + rng() * 36, G + 30 + rng() * 60); ctx.rotate(rng() * TAU); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
            ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(x + 14 + rng() * 20, G + 12, 5 + rng() * 4, 0, Math.PI); ctx.fill();
            break;
          case "dino":
            ctx.fillStyle = "#6fcf7a"; for (let k = 0; k < 3; k++) { const gx = x + 4 + rng() * 40; ctx.beginPath(); ctx.moveTo(gx - 4, G + 1); ctx.lineTo(gx, G - 8 - rng() * 6); ctx.lineTo(gx + 4, G + 1); ctx.fill(); }
            ctx.fillStyle = "rgba(0,0,0,.14)"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + rng() * 48, G + 30 + rng() * 50, 2 + rng() * 3, 0, TAU); ctx.fill(); }
            break;
          case "ocean":
            ctx.fillStyle = "rgba(255,255,255,.5)"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + rng() * 48, G + 18 + rng() * 60, 1.5 + rng() * 2, 0, TAU); ctx.fill(); }
            if (rng() > 0.7) { ctx.fillStyle = "#ff9d85"; ctx.beginPath(); ctx.arc(x + 24, G + 40 + rng() * 20, 6, Math.PI, 0); ctx.fill(); }
            break;
          default:
            for (let k = 0; k < 2; k++) { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(x + 10 + rng() * 30, G + 30 + rng() * 50, 7 + rng() * 6, 4 + rng() * 3, 0, 0, TAU); ctx.fill(); }
            ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x + rng() * 40, G + 14 + rng() * 60, 3, 3);
        }
      }
    }
  }

  drawEntities(sim, theme, world, camX, viewW, time, pulse) {
    const ctx = this.ctx;
    const left = camX - 80, right = camX + viewW + 80;
    const entities = sim.entities;
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (e.x + (e.w ?? 0) < left) continue;
      if (e.x > right) break;
      switch (e.type) {
        case "spike": this.drawHazard(e, theme, world, time); break;
        case "block": this.drawBlock(e, theme, world); break;
        case "plat": this.drawPlatform(e, theme, world); break;
        case "pad": this.drawPad(e, time, pulse); break;
        case "orb": if (sim.lastOrbId !== e.__id) this.drawOrb(e, time, pulse); else this.drawOrb(e, time, pulse, true); break;
        case "star": if (!sim.collected.has(e.__id)) this.drawStar(e, time, i); break;
        case "coin": if (!sim.collected.has(e.__id)) this.drawCoin(e, time); break;
        case "speed": this.drawPortal(e, e.value === "fast" ? "#ff9a3c" : e.value === "slow" ? "#5fb8ff" : "#6fe07a", e.value === "fast" ? "»»" : e.value === "slow" ? "›" : "»", time); break;
        case "fly": this.drawPortal(e, e.on ? "#ff7bd5" : "#8fe3ff", e.on ? "✦" : "■", time); break;
        case "checkpoint": this.drawCheckpoint(e, sim.used.has(e.__id), time); break;
        case "finish": this.drawFinish(e, time, pulse); break;
        case "sign": this.drawSign(e); break;
        default: break;
      }
    }
  }

  drawHazard(e, theme, world, time) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, bottom = e.y + e.h;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.beginPath(); ctx.ellipse(cx, bottom + 2, e.w * 0.55, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = theme.hazard; ctx.strokeStyle = theme.hazardDark; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    if (world.id === "ocean") {
      ctx.beginPath(); ctx.arc(cx, bottom - 13, 13, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = theme.hazard; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let k = 0; k < 9; k++) { const a = Math.PI + k * Math.PI / 8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 12, bottom - 13 + Math.sin(a) * 12); ctx.lineTo(cx + Math.cos(a) * 20, bottom - 13 + Math.sin(a) * 20); ctx.stroke(); }
    } else if (world.id === "dino") {
      rr(ctx, cx - 9, bottom - e.h, 18, e.h, 9); ctx.fill(); ctx.stroke();
      rr(ctx, cx - 19, bottom - 22, 9, 12, 4); ctx.fill(); ctx.stroke();
      rr(ctx, cx + 10, bottom - 26, 9, 12, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#dff5d0"; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - 9, bottom - 8 - k * 7); ctx.lineTo(cx - 13, bottom - 10 - k * 7); ctx.stroke(); }
    } else if (world.id === "space") {
      ctx.beginPath(); ctx.moveTo(e.x + 2, bottom); ctx.lineTo(cx - 4, e.y + 2); ctx.lineTo(cx + 5, e.y + 8); ctx.lineTo(e.x + e.w - 2, bottom); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(cx - 3, bottom - 2); ctx.lineTo(cx - 4, e.y + 6); ctx.lineTo(cx, e.y + 10); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(e.x + 3, bottom); ctx.quadraticCurveTo(cx - 2, e.y + 2, cx, e.y + 1); ctx.quadraticCurveTo(cx + 2, e.y + 2, e.x + e.w - 3, bottom); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.5)"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx - 6 + k * 6, bottom - 8 - k * 6, 2, 0, TAU); ctx.fill(); }
    }
    // Gentle sleepy eyes so hazards stay friendly.
    ctx.strokeStyle = theme.hazardDark; ctx.lineWidth = 2; ctx.lineCap = "round";
    const ey = bottom - e.h * 0.42;
    ctx.beginPath(); ctx.arc(cx - 5, ey, 2.6, Math.PI, 0); ctx.arc(cx + 5, ey, 2.6, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }

  drawBlock(e, theme, world) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.16)"; rr(ctx, e.x + 3, e.y + 5, e.w, e.h, 8); ctx.fill();
    ctx.fillStyle = theme.block; rr(ctx, e.x, e.y, e.w, e.h, 8); ctx.fill();
    ctx.strokeStyle = theme.blockDark; ctx.lineWidth = 3; rr(ctx, e.x, e.y, e.w, e.h, 8); ctx.stroke();
    ctx.fillStyle = theme.blockLight; rr(ctx, e.x + 4, e.y + 4, e.w - 8, Math.min(12, e.h * 0.3), 5); ctx.fill();
    if (world.id === "candy") { ctx.fillStyle = "#ff5fa2"; for (let k = 8; k < e.w - 4; k += 14) { ctx.beginPath(); ctx.arc(e.x + k, e.y + Math.min(14, e.h * 0.35) + 2, 2.5, 0, TAU); ctx.fill(); } }
    if (world.id === "space") { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x + 6, e.y + e.h - 6); ctx.lineTo(e.x + e.w - 6, e.y + 6); ctx.stroke(); }
    if (world.id === "dino" && e.h > 20) { ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.beginPath(); ctx.arc(e.x + e.w * 0.3, e.y + e.h * 0.6, 4, 0, TAU); ctx.arc(e.x + e.w * 0.7, e.y + e.h * 0.45, 3, 0, TAU); ctx.fill(); }
    if (world.id === "ocean") { ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 2; for (let k = 10; k < e.w; k += 16) { ctx.beginPath(); ctx.arc(e.x + k, e.y + e.h - 8, 5, Math.PI, 0); ctx.stroke(); } }
    ctx.restore();
  }

  drawPlatform(e, theme) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.16)"; rr(ctx, e.x + 2, e.y + 5, e.w, e.h, 8); ctx.fill();
    ctx.fillStyle = theme.platform; rr(ctx, e.x, e.y, e.w, e.h, 8); ctx.fill();
    ctx.strokeStyle = theme.platformDark; ctx.lineWidth = 2.5; rr(ctx, e.x, e.y, e.w, e.h, 8); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.5)"; rr(ctx, e.x + 5, e.y + 3, e.w - 10, 4, 2); ctx.fill();
    ctx.restore();
  }

  drawPad(e, time, pulse) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, bottom = e.y + e.h;
    ctx.save();
    ctx.fillStyle = "#c98a1c"; rr(ctx, e.x, bottom - 6, e.w, 6, 3); ctx.fill();
    ctx.fillStyle = "#ffd24d"; rr(ctx, e.x - 2, bottom - 12 - pulse * 3, e.w + 4, 8, 4); ctx.fill();
    ctx.fillStyle = `rgba(255,230,120,${0.35 + pulse * 0.4})`; ctx.beginPath(); ctx.ellipse(cx, bottom - 10, e.w * 0.9, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff6c7"; ctx.lineWidth = 3; ctx.lineCap = "round";
    const lift = Math.sin(time * 6) * 3;
    ctx.beginPath(); ctx.moveTo(cx - 7, bottom - 20 + lift); ctx.lineTo(cx, bottom - 28 + lift); ctx.lineTo(cx + 7, bottom - 20 + lift); ctx.stroke();
    ctx.restore();
  }

  drawOrb(e, time, pulse, used = false) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    ctx.save();
    ctx.globalAlpha = used ? 0.35 : 1;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, e.r * 1.6);
    glow.addColorStop(0, "rgba(255,240,150,.9)"); glow.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, e.r * 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(cx, cy, e.r * 0.55, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, e.r * 0.55, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 - pulse * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, e.r * (0.7 + pulse * 0.5), 0, TAU); ctx.stroke();
    label(ctx, "toque!", cx, cy - e.r - 8, 10, { fill: "#fff", stroke: "#8a5a00" });
    ctx.restore();
  }

  drawStar(e, time, index) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2 + Math.sin(time * 3 + index) * 3;
    ctx.save();
    ctx.fillStyle = "rgba(255,230,120,.35)"; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffd24d"; ctx.strokeStyle = "#fff6c7"; ctx.lineWidth = 2; ctx.lineJoin = "round";
    star(ctx, cx, cy, 12, 5.5, 5, time * 1.5 + index); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawCoin(e, time) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2 + Math.sin(time * 2.4) * 4;
    const w = Math.abs(Math.cos(time * 2.2));
    ctx.save();
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 34);
    glow.addColorStop(0, "rgba(255,215,90,.6)"); glow.addColorStop(1, "rgba(255,215,90,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, TAU); ctx.fill();
    ctx.translate(cx, cy); ctx.scale(Math.max(0.15, w), 1);
    ctx.fillStyle = "#f0a21c"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffd24d"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = "#f0a21c"; star(ctx, 0, 0, 8, 3.5, 5, 0); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.6 + Math.sin(time * 8) * 0.4; star(ctx, cx + 13, cy - 13, 4, 1.5, 4, time); ctx.fill(); ctx.restore();
  }

  drawPortal(e, color, glyph, time) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(cx, cy, e.w * 0.9, e.h / 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(cx, cy, e.w * 0.5, e.h / 2 - 8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, e.w * 0.9, e.h / 2, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.3;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, e.w * 1.3, e.h / 2 + 8, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    label(ctx, glyph, cx, cy, 20, { fill: "#fff", stroke: color });
    ctx.restore();
  }

  drawCheckpoint(e, passed, time) {
    const ctx = this.ctx;
    const bottom = e.y + e.h;
    ctx.save();
    ctx.fillStyle = "#6b5a92"; rr(ctx, e.x, e.y, 5, e.h, 2); ctx.fill();
    ctx.fillStyle = passed ? "#5fcc74" : "#ff7bd5";
    const wave = Math.sin(time * 6) * 3;
    ctx.beginPath(); ctx.moveTo(e.x + 5, e.y + 2); ctx.lineTo(e.x + 30, e.y + 10 + wave); ctx.lineTo(e.x + 5, e.y + 20); ctx.closePath(); ctx.fill();
    if (passed) label(ctx, "✓", e.x + 15, e.y + 10, 11, { fill: "#fff", stroke: "#2f7d41" });
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.beginPath(); ctx.ellipse(e.x + 3, bottom + 2, 10, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawFinish(e, time, pulse) {
    const ctx = this.ctx;
    const bottom = e.y + e.h;
    ctx.save();
    ctx.fillStyle = "#ffd24d"; rr(ctx, e.x, e.y, 10, e.h, 4); ctx.fill(); rr(ctx, e.x + 70, e.y, 10, e.h, 4); ctx.fill();
    ctx.fillStyle = "#ff5fa2"; rr(ctx, e.x - 8, e.y - 14, 96, 30, 12); ctx.fill();
    label(ctx, "META", e.x + 40, e.y + 1, 18, { fill: "#fff", stroke: "#b02a68" });
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = ["#59e3ff", "#ffd24d", "#ff7bd5", "#6fe07a"][k % 4];
      const fx = e.x + 8 + k * 12, fy = e.y + 20 + Math.sin(time * 5 + k) * 3;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 10, fy); ctx.lineTo(fx + 5, fy + 10); ctx.fill();
    }
    ctx.fillStyle = `rgba(255,255,255,${0.25 + pulse * 0.4})`; rr(ctx, e.x + 10, e.y + 36, 60, bottom - e.y - 36, 6); ctx.fill();
    ctx.restore();
  }

  drawSign(e) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#8a5a3c"; rr(ctx, e.x + e.w / 2 - 4, e.y + 20, 8, e.h - 20, 3); ctx.fill();
    ctx.fillStyle = "#ffe8b5"; rr(ctx, e.x - 40, e.y - 6, e.w + 80, 36, 10); ctx.fill();
    ctx.strokeStyle = "#c98a1c"; ctx.lineWidth = 3; rr(ctx, e.x - 40, e.y - 6, e.w + 80, 36, 10); ctx.stroke();
    label(ctx, e.label, e.x + e.w / 2, e.y + 12, 13, { fill: "#6b4a1b", stroke: "#fff3d6" });
    ctx.restore();
  }

  drawPlayer(sim, character, theme, time) {
    const ctx = this.ctx;
    const cx = sim.x + S / 2, cy = sim.y + S / 2;
    const flying = sim.mode === "fly";
    const bubble = flying || sim.time < sim.bubbleUntil;
    if (!flying && !sim.gapAt(cx)) {
      const height = Math.max(0, G - (sim.y + S));
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0.05, 0.22 - height / 500).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(cx, G + 3, S * 0.6 * (1 - height / 400), 5, 0, 0, TAU); ctx.fill();
    }
    if (sim.invulnerable && !bubble && Math.floor(sim.time * 14) % 2 === 0) ctx.globalAlpha = 0.55;
    ctx.save();
    ctx.translate(cx, cy);
    const squash = sim.squash;
    ctx.scale(1 + squash * 0.22, 1 - squash * 0.22);
    ctx.rotate(characterRotation(character.id, { rot: sim.rot, vy: sim.vy, mode: sim.mode }));
    ctx.scale(S / 48, S / 48);
    const pose = sim.finished ? "happy" : flying ? "fly" : sim.grounded ? "run" : "jump";
    drawCharacter(ctx, character.id, { pose, t: sim.time, vy: sim.vy, flame: flying });
    ctx.restore();
    ctx.globalAlpha = 1;
    if (bubble) {
      ctx.save();
      const r = S * 0.95;
      const gradient = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy, r);
      gradient.addColorStop(0, "rgba(255,255,255,.35)"); gradient.addColorStop(0.8, "rgba(170,230,255,.12)"); gradient.addColorStop(1, "rgba(120,210,255,.4)");
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(cx, cy, r - 7, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles(sim, theme) {
    const ctx = this.ctx;
    for (const p of sim.particles) {
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.save();
      ctx.globalAlpha = alpha;
      switch (p.kind) {
        case "spark": ctx.fillStyle = p.hue > 0.5 ? "#ffd24d" : "#ffffff"; star(ctx, p.x, p.y, p.size, p.size * 0.4, 4, p.spin); ctx.fill(); break;
        case "confetti": ctx.fillStyle = theme.decor[Math.floor(p.hue * 4)]; ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); break;
        case "trail": ctx.fillStyle = "rgba(170,230,255,.8)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6 * alpha, 0, TAU); ctx.fill(); break;
        case "puff": ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - alpha), 0, TAU); ctx.fill(); break;
        default: ctx.fillStyle = theme.particle; ctx.globalAlpha = alpha * 0.55; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawTexts(sim) {
    const ctx = this.ctx;
    for (const t of sim.texts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life * 1.5);
      const scale = 1 + Math.max(0, t.life - 1.1) * 2;
      ctx.translate(t.x, t.y); ctx.scale(scale, scale);
      label(ctx, t.text, 0, 0, 15, t.kind === "soft" ? { fill: "#fff", stroke: "#6c55d9" } : { fill: "#fff6c7", stroke: "#d9762b" });
      ctx.restore();
    }
  }

  drawHud(sim, theme, viewW, hint, challengeMode, time) {
    const ctx = this.ctx;
    const barW = Math.min(300, viewW * 0.42), barX = (viewW - barW) / 2, barY = 14;
    ctx.save();
    ctx.fillStyle = "rgba(40,28,80,.45)"; rr(ctx, barX - 2, barY - 2, barW + 4, 16, 8); ctx.fill();
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, "#6fe07a"); grad.addColorStop(0.5, "#ffd24d"); grad.addColorStop(1, "#ff7bd5");
    ctx.fillStyle = grad; rr(ctx, barX, barY, Math.max(10, barW * sim.progress), 12, 6); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)"; rr(ctx, barX, barY, Math.max(10, barW * sim.progress), 5, 3); ctx.fill();
    label(ctx, `${Math.round(sim.progress * 100)}%`, viewW / 2, barY + 27, 13);
    // Stars.
    ctx.fillStyle = "rgba(40,28,80,.45)"; rr(ctx, 12, 10, 84, 30, 15); ctx.fill();
    ctx.fillStyle = "#ffd24d"; star(ctx, 30, 25, 10, 4.5, 5, time * 0.6); ctx.fill();
    const pop = 1 + sim.comboPulse * 0.25;
    ctx.save(); ctx.translate(66, 25); ctx.scale(pop, pop); label(ctx, `${sim.stars}`, 0, 0, 16); ctx.restore();
    // Coins.
    ctx.fillStyle = "rgba(40,28,80,.45)"; rr(ctx, viewW - 96, 10, 84, 30, 15); ctx.fill();
    for (let k = 0; k < 3; k++) {
      const cx = viewW - 76 + k * 26;
      ctx.fillStyle = sim.coins[k] ? "#ffd24d" : "rgba(255,255,255,.25)";
      ctx.beginPath(); ctx.arc(cx, 25, 9, 0, TAU); ctx.fill();
      if (sim.coins[k]) { ctx.fillStyle = "#f0a21c"; star(ctx, cx, 25, 5, 2.2, 5, 0); ctx.fill(); }
      else { ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, 25, 9, 0, TAU); ctx.stroke(); }
    }
    if (challengeMode) label(ctx, `Tentativa ${sim.attempts}`, viewW - 54, 54, 12, { fill: "#fff", stroke: "#6c55d9" });
    if (sim.streak >= 5 && !sim.finished) {
      ctx.save(); ctx.translate(54, 62); ctx.scale(pop, pop);
      label(ctx, `x${sim.streak} 🔥`, 0, 0, 14, { fill: "#fff6c7", stroke: "#d9762b" });
      ctx.restore();
    }
    if (hint) {
      const alpha = 0.6 + Math.sin(time * 4) * 0.3;
      ctx.globalAlpha = alpha;
      label(ctx, hint, viewW / 2, VIEW_H - 22, 16, { fill: "#fff", stroke: "#3b2f6b" });
      ctx.globalAlpha = 1;
    }
    if (sim.mode === "fly" && !sim.finished) label(ctx, "Segure para subir ☁️", viewW / 2, VIEW_H - 22, 14, { fill: "#fff", stroke: "#2b6cb0" });
    ctx.restore();
  }
}

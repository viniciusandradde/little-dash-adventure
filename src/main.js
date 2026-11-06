import "./styles.css";
import { CHARACTERS, WORLDS } from "./config.js";
import { LEVELS, getLevel, getNextLevel, getWorld } from "./game/levels.js";
import { GameEngine } from "./game/engine.js";
import { drawCharacter } from "./game/characters.js";
import { loadProgress, saveProgress, resetProgress, recordResult } from "./services/storage.js";
import { AudioEngine } from "./services/audio.js";
import * as screens from "./ui/screens.js";

const app = document.querySelector("#app");
const screen = document.querySelector("#screen");
const params = new URLSearchParams(location.search);
const QA = params.get("qa") === "1";

let progress = loadProgress();
let engine = null;
let activeLevel = null;
let heroLoop = 0;
const audio = new AudioEngine({ sound: progress.settings.sound, music: progress.settings.music });

function persist() { saveProgress(progress); }

function setScreen(html, { screenName }) {
  cancelAnimationFrame(heroLoop);
  screen.innerHTML = html;
  app.dataset.screen = screenName;
  document.body.classList.toggle("in-game", screenName === "game");
  animateHeroes();
  if (screenName !== "game" && screenName !== "results") audio.setIntensity(0.5);
}

/** Small animated canvases that show the characters in menus. */
function animateHeroes() {
  const canvases = [...screen.querySelectorAll("canvas[data-hero-character]")];
  if (!canvases.length) return;
  const start = performance.now();
  const frame = (now) => {
    const t = (now - start) / 1000;
    for (const canvas of canvases) {
      const ctx = canvas.getContext("2d");
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2 + Math.sin(t * 2.4) * size * 0.03);
      ctx.fillStyle = "rgba(60,40,110,.14)";
      ctx.beginPath(); ctx.ellipse(0, size * 0.33, size * 0.26, size * 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(Math.sin(t * 2.4) * 0.06);
      ctx.scale(size / 80, size / 80);
      drawCharacter(ctx, canvas.dataset.heroCharacter, { pose: "run", t, vy: 0 });
      ctx.restore();
    }
    heroLoop = requestAnimationFrame(frame);
  };
  heroLoop = requestAnimationFrame(frame);
}

// ---- navigation -----------------------------------------------------------
function stopGame() {
  engine?.destroy();
  engine = null;
}

function goHome() { stopGame(); setScreen(screens.homeScreen(progress), { screenName: "home" }); playMenuMusic(); }
function goWorlds() { stopGame(); setScreen(screens.worldsScreen(progress), { screenName: "worlds" }); playMenuMusic(); }
function goLevels(worldId) { stopGame(); setScreen(screens.levelsScreen(progress, worldId), { screenName: "levels" }); playMenuMusic(); }
function goCharacters() { stopGame(); setScreen(screens.charactersScreen(progress), { screenName: "characters" }); }
function goAlbum() { stopGame(); setScreen(screens.albumScreen(progress), { screenName: "album" }); }
function goSettings() { stopGame(); setScreen(screens.settingsScreen(progress), { screenName: "settings" }); }

let audioUnlocked = false;
function playMenuMusic() { if (audioUnlocked) audio.playMusic("menu", 7); }

function startGame(levelId) {
  stopGame();
  activeLevel = getLevel(levelId);
  const world = getWorld(activeLevel.worldId);
  const character = CHARACTERS.find((item) => item.id === progress.selectedCharacter) ?? CHARACTERS[0];
  progress.lastPlayedLevel = activeLevel.id;
  persist();
  setScreen(screens.gameScreen(activeLevel, world), { screenName: "game" });
  const canvas = screen.querySelector("#game-canvas");
  engine = new GameEngine(canvas, {
    level: activeLevel,
    world,
    character,
    challengeMode: progress.settings.challengeMode,
    reducedMotion: progress.settings.reducedMotion,
    beatPhase: () => audio.beatPhase(),
    onEvent: handleGameEvent
  });
  if (audioUnlocked) audio.playMusic(world.id, 100 + LEVELS.indexOf(activeLevel));
  audio.setIntensity(0.75);
  engine.start();
  if (QA) window.__lda = { engine, sim: engine.sim, audio, progress, setTimeScale: (value) => { engine.timeScale = value; } };
}

function handleGameEvent(type, payload, sim) {
  switch (type) {
    case "jump": audio.jump(); break;
    case "land": audio.land(); break;
    case "star": audio.star(payload.streak); audio.setIntensity(0.75 + Math.min(0.25, payload.streak / 60)); break;
    case "coin": audio.coin(); break;
    case "pad": audio.pad(); break;
    case "orb": audio.orb(); break;
    case "bump": audio.bump(); audio.setIntensity(0.65); break;
    case "bubble": audio.bubble(); break;
    case "checkpoint": audio.checkpoint(); break;
    case "speed": audio.speed(); break;
    case "mode": audio.mode(); break;
    case "respawn": audio.bump(); break;
    case "finish": audio.finish(); audio.setIntensity(1); break;
    case "complete": finishGame(payload); break;
    default: break;
  }
}

function finishGame(result) {
  const level = getLevel(result.levelId);
  const world = getWorld(level.worldId);
  const outcome = recordResult(progress, result);
  persist();
  stopGame();
  setScreen(screens.resultsScreen({ level, world, result, outcome, next: getNextLevel(level.id) }), { screenName: "results" });
}

function pauseGame() {
  if (!engine || engine.paused) return;
  engine.pause();
  audio.pauseMusic();
  screen.insertAdjacentHTML("beforeend", screens.pauseOverlay());
}

function resumeGame() {
  screen.querySelector('[data-overlay="pause"]')?.remove();
  engine?.resume();
  audio.resumeMusic();
}

// ---- events ---------------------------------------------------------------
document.addEventListener("pointerdown", () => {
  if (audioUnlocked) return;
  if (audio.unlock()) { audioUnlocked = true; if (app.dataset.screen !== "game") playMenuMusic(); }
}, { capture: true });

screen.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  audio.ui();
  if (target.dataset.world && !target.dataset.action) return goLevels(target.dataset.world);
  if (target.dataset.character) {
    progress.selectedCharacter = target.dataset.character;
    persist();
    return goCharacters();
  }
  const action = target.dataset.action;
  if (action === "play" || (!action && target.dataset.level)) return startGame(target.dataset.level);
  switch (action) {
    case "home": return goHome();
    case "worlds": return goWorlds();
    case "levels": return goLevels(target.dataset.world);
    case "characters": return goCharacters();
    case "album": return goAlbum();
    case "settings": return goSettings();
    case "pause": return pauseGame();
    case "resume": return resumeGame();
    case "replay": return startGame(activeLevel.id);
    case "reset-progress":
      if (window.confirm("Apagar todo o progresso deste aparelho?")) { progress = resetProgress(); persist(); goSettings(); }
      return undefined;
    default: return undefined;
  }
});

screen.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-setting]");
  if (!input) return;
  progress.settings[input.dataset.setting] = input.checked;
  persist();
  if (input.dataset.setting === "sound") audio.setSound(input.checked);
  if (input.dataset.setting === "music") { audio.setMusic(input.checked); if (input.checked) playMenuMusic(); }
});

window.addEventListener("keydown", (event) => {
  if (app.dataset.screen !== "game") return;
  if (event.code === "KeyP" || event.code === "Escape") { if (engine?.paused) resumeGame(); else pauseGame(); }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && app.dataset.screen === "game") pauseGame();
});

goHome();
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}));
}

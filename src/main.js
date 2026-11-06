import "./styles.css";
import { CHARACTERS, WORLDS } from "./config.js";
import { LEVELS, getLevel } from "./game/level-data.js";
import { GameEngine } from "./game/engine.js";
import { loadProgress, saveProgress } from "./services/storage.js";
import { GameAudio } from "./services/audio.js";

const screen = document.querySelector("#screen");
const soundToggle = document.querySelector("#sound-toggle");
let progress = loadProgress();
let engine = null;
let activeLevel = null;
const gameAudio = new GameAudio(progress.soundEnabled);

const button = (label, action, extra = "") => `<button class="primary-button ${extra}" data-action="${action}">${label}</button>`;

function renderHome() {
  screen.innerHTML = `
    <div class="home-panel">
      <div class="hero-character">🟦</div>
      <p class="eyebrow">UMA AVENTURA FEITA PARA SORRIR</p>
      <h1>Vamos brincar?</h1>
      <p class="intro">Pule, descubra e colecione estrelinhas. Aqui todo mundo consegue chegar ao final!</p>
      ${button("▶ JOGAR", "worlds")}
      <div class="secondary-actions">
        <button class="soft-button" data-action="characters">😊 Personagens</button>
        <button class="soft-button" data-action="worlds">🌈 Mundos</button>
      </div>
      <p class="small-note">Sem vidas • Sem Game Over • Diversão sem pressão</p>
    </div>`;
}

function renderWorlds() {
  screen.innerHTML = `<div class="selection-panel"><h1>Escolha um mundo 🌈</h1><div class="world-grid">${WORLDS.map((world) => `
    <button class="world-card" data-world="${world.id}" style="--world:${world.color};--world-image:url(${world.background})">
      <span class="world-emoji">${world.emoji}</span><strong>${world.name}</strong><small>3 aventuras</small>
    </button>`).join("")}</div><button class="soft-button" data-action="home">← Início</button></div>`;
}

function renderLevels(worldId) {
  const world = WORLDS.find((item) => item.id === worldId) ?? WORLDS[0];
  const levels = LEVELS.filter((level) => level.worldId === world.id);
  screen.innerHTML = `<div class="selection-panel"><h1>${world.emoji} ${world.name}</h1><div class="level-grid">${levels.map((level, index) => `
    <button class="level-card" data-level="${level.id}"><span>⭐ ${index + 1}</span><strong>${level.name}</strong><small>Toque para começar</small></button>`).join("")}</div><button class="soft-button" data-action="worlds">← Mundos</button></div>`;
}

function renderCharacters() {
  screen.innerHTML = `<div class="selection-panel"><h1>Quem vai brincar? 😊</h1><div class="character-grid">${CHARACTERS.map((character) => `
    <button class="character-card ${progress.selectedCharacter === character.id ? "selected" : ""}" data-character="${character.id}">
      <span>${character.emoji}</span><strong>${character.name}</strong>
    </button>`).join("")}</div><button class="soft-button" data-action="home">Pronto!</button></div>`;
}

function startGame(levelId) {
  activeLevel = getLevel(levelId);
  progress.lastPlayedLevel = activeLevel.id;
  saveProgress(progress);
  screen.innerHTML = `
    <div class="game-panel">
      <div class="game-toolbar">
        <button class="soft-button" data-action="pause">Ⅱ Pausar</button>
        <span>Toque para pular 👆</span>
        <span id="star-counter">⭐ 0</span>
      </div>
      <canvas id="game-canvas" aria-label="Área do jogo"></canvas>
      <button class="jump-button" data-action="jump">PULAR</button>
    </div>`;
  const canvas = screen.querySelector("#game-canvas");
  const character = CHARACTERS.find((item) => item.id === progress.selectedCharacter) ?? CHARACTERS[0];
  engine?.destroy();
  engine = new GameEngine(canvas, {
    onJump: () => gameAudio.jump(),
    onStumble: () => gameAudio.tone(190, 0.16, "sine", 0.06),
    onStar: (count) => { const counter = screen.querySelector("#star-counter"); if (counter) counter.textContent = `⭐ ${count}`; gameAudio.collect(); },
    onComplete: (result) => { gameAudio.celebrate(); finishGame(result); }
  });
  engine.start(activeLevel, character);
  gameAudio.play();
  canvas.addEventListener("pointerdown", () => engine?.jump());
}

function finishGame(result) {
  progress.stars += result.stars;
  if (!progress.completedLevels.includes(result.level.id)) progress.completedLevels.push(result.level.id);
  saveProgress(progress);
  screen.innerHTML = `
    <div class="home-panel celebration">
      <div class="hero-character">🎉</div><p class="eyebrow">MISSÃO CONCLUÍDA</p>
      <h1>Você conseguiu!</h1><p class="intro">Que aventura maravilhosa!</p>
      <div class="reward">⭐ ${result.stars} estrelinhas</div>
      <p class="small-note">Total de estrelas: ${progress.stars} • Aventuras concluídas: ${progress.completedLevels.length}</p>
      ${button("JOGAR DE NOVO", "replay")}
      ${button("ESCOLHER OUTRO MUNDO", "worlds", "secondary-button")}
    </div>`;
}

function pauseGame() {
  engine?.pause();
  screen.insertAdjacentHTML("beforeend", `<div class="pause-overlay"><div><h2>Vamos descansar?</h2><button class="primary-button" data-action="resume">Continuar ▶</button><button class="soft-button" data-action="home">Início</button></div></div>`);
}

screen.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.world) return renderLevels(target.dataset.world);
  if (target.dataset.level) return startGame(target.dataset.level);
  if (target.dataset.character) {
    progress.selectedCharacter = target.dataset.character;
    saveProgress(progress);
    return renderCharacters();
  }
  const action = target.dataset.action;
  if (action === "home") { engine?.destroy(); engine = null; gameAudio.stop(); renderHome(); }
  if (action === "worlds") { engine?.destroy(); engine = null; gameAudio.stop(); renderWorlds(); }
  if (action === "characters") renderCharacters();
  if (action === "jump") engine?.jump();
  if (action === "pause") pauseGame();
  if (action === "resume") { screen.querySelector(".pause-overlay")?.remove(); engine?.resume(); gameAudio.play(); }
  if (action === "replay") startGame(activeLevel.id);
});

soundToggle.addEventListener("click", () => {
  progress.soundEnabled = !progress.soundEnabled;
  soundToggle.textContent = progress.soundEnabled ? "🔊" : "🔇";
  saveProgress(progress);
  gameAudio.setEnabled(progress.soundEnabled);
});
soundToggle.textContent = progress.soundEnabled ? "🔊" : "🔇";

renderHome();
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

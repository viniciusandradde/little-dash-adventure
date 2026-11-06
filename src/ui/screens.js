import { CHARACTERS, WORLDS } from "../config.js";
import { LEVELS } from "../game/levels.js";
import { levelRecord, summarize, worldSummary, isStickerUnlocked } from "../services/storage.js";

const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function ratingStars(rating, size = "") {
  return `<span class="rating ${size}" aria-label="${rating} de 3 estrelas">${[1, 2, 3].map((n) => `<i class="${n <= rating ? "on" : ""}">★</i>`).join("")}</span>`;
}

export function coinDots(coins) {
  return `<span class="coins" aria-label="${coins.filter(Boolean).length} de 3 moedas">${coins.map((has) => `<i class="${has ? "on" : ""}"></i>`).join("")}</span>`;
}

export function homeScreen(progress) {
  const summary = summarize(progress);
  const character = CHARACTERS.find((item) => item.id === progress.selectedCharacter) ?? CHARACTERS[0];
  const level = LEVELS.find((item) => item.id === progress.lastPlayedLevel) ?? LEVELS[0];
  const world = WORLDS.find((item) => item.id === level.worldId);
  return `
    <section class="screen-home" data-screen="home">
      <div class="hero-card" style="--world-image:url('${world.background}')">
        <canvas class="hero-canvas" data-hero-character="${character.id}" width="260" height="260" aria-hidden="true"></canvas>
        <div class="hero-name">${esc(character.name)}<small>${esc(character.tagline)}</small></div>
      </div>
      <div class="home-content">
        <p class="eyebrow">Uma aventura rítmica para pequenos exploradores</p>
        <h1 class="title"><span>Little Dash</span><span class="title-accent">Adventure</span></h1>
        <div class="stat-row">
          <span class="chip">⭐ ${summary.totalStars} estrelas</span>
          <span class="chip">🪙 ${summary.totalCoins}/36 moedas</span>
          <span class="chip">🏅 ${summary.completedLevels}/12 aventuras</span>
        </div>
        <button class="btn btn-primary btn-xl" data-action="play" data-level="${level.id}">
          <span class="btn-icon">▶</span><span><strong>Jogar</strong><small>${esc(world.emoji)} ${esc(level.name)}</small></span>
        </button>
        <div class="button-row">
          <button class="btn btn-soft" data-action="worlds">🌈 Mundos</button>
          <button class="btn btn-soft" data-action="characters">😊 Personagens</button>
          <button class="btn btn-soft" data-action="album">📒 Álbum</button>
          <button class="btn btn-soft" data-action="settings">⚙️ Ajustes</button>
        </div>
        <p class="small-note">Sem anúncios • Sem compras • Sem Game Over • Funciona offline</p>
      </div>
    </section>`;
}

export function worldsScreen(progress) {
  return `
    <section class="screen-list" data-screen="worlds">
      <header class="list-header"><button class="btn btn-icon" data-action="home" aria-label="Voltar">←</button><h1>Escolha um mundo</h1></header>
      <div class="world-grid">
        ${WORLDS.map((world) => {
          const summary = worldSummary(progress, world.id);
          return `
          <button class="world-card" data-world="${world.id}" style="--world:${world.color};--world-image:url('${world.background}')">
            <span class="world-emoji">${world.emoji}</span>
            <strong>${esc(world.name)}</strong>
            <span class="world-meta"><span>★ ${summary.rating}/${summary.maxRating}</span><span>🪙 ${summary.coins}/${summary.maxCoins}</span></span>
            <span class="world-progress"><i style="width:${(summary.completed / world.levels.length) * 100}%"></i></span>
          </button>`;
        }).join("")}
      </div>
    </section>`;
}

export function levelsScreen(progress, worldId) {
  const world = WORLDS.find((item) => item.id === worldId) ?? WORLDS[0];
  const levels = LEVELS.filter((level) => level.worldId === world.id);
  const summary = worldSummary(progress, world.id);
  return `
    <section class="screen-list" data-screen="levels" style="--world:${world.color};--world-image:url('${world.background}')">
      <header class="list-header"><button class="btn btn-icon" data-action="worlds" aria-label="Voltar">←</button><h1>${world.emoji} ${esc(world.name)}</h1><span class="chip">★ ${summary.rating}/${summary.maxRating}</span></header>
      <div class="level-grid">
        ${levels.map((level, index) => {
          const record = levelRecord(progress, level.id);
          const previous = index === 0 ? null : levelRecord(progress, levels[index - 1].id);
          const isNew = !record.completed && (index === 0 || previous?.completed);
          return `
          <button class="level-card ${record.completed ? "done" : ""}" data-level="${level.id}">
            <span class="level-number">${index + 1}</span>
            <strong>${esc(level.name)}</strong>
            ${ratingStars(record.bestRating)}
            <span class="level-meta">${coinDots(record.coins)}<span>⭐ ${record.bestStars}/${level.totalStars}</span></span>
            ${isNew ? '<span class="tag">Novo!</span>' : record.noHit ? '<span class="tag tag-gold">Sem tropeços</span>' : ""}
            <span class="level-play">▶ Jogar</span>
          </button>`;
        }).join("")}
      </div>
    </section>`;
}

export function charactersScreen(progress) {
  return `
    <section class="screen-list" data-screen="characters">
      <header class="list-header"><button class="btn btn-icon" data-action="home" aria-label="Voltar">←</button><h1>Quem vai brincar?</h1></header>
      <div class="character-grid">
        ${CHARACTERS.map((character) => `
          <button class="character-card ${progress.selectedCharacter === character.id ? "selected" : ""}" data-character="${character.id}" style="--accent:${character.color}">
            <canvas data-hero-character="${character.id}" width="160" height="160" aria-hidden="true"></canvas>
            <strong>${esc(character.name)}</strong><small>${esc(character.tagline)}</small>
            <span class="check">✓</span>
          </button>`).join("")}
      </div>
      <button class="btn btn-primary" data-action="home">Pronto!</button>
    </section>`;
}

export function albumScreen(progress) {
  const summary = summarize(progress);
  return `
    <section class="screen-list" data-screen="album">
      <header class="list-header"><button class="btn btn-icon" data-action="home" aria-label="Voltar">←</button><h1>Álbum de figurinhas</h1><span class="chip">${summary.stickers}/12</span></header>
      <p class="intro">Colete as 3 moedas secretas de uma aventura para ganhar a figurinha dela.</p>
      <div class="sticker-grid">
        ${LEVELS.map((level) => {
          const world = WORLDS.find((item) => item.id === level.worldId);
          const unlocked = isStickerUnlocked(progress, level.id);
          const coins = levelRecord(progress, level.id).coins.filter(Boolean).length;
          return `
          <div class="sticker ${unlocked ? "unlocked" : ""}" style="--world:${world.color}">
            <span class="sticker-art">${unlocked ? world.stickers[level.index] : "?"}</span>
            <strong>${esc(level.name)}</strong>
            <small>${unlocked ? "Completa!" : `${coins}/3 moedas`}</small>
          </div>`;
        }).join("")}
      </div>
    </section>`;
}

export function settingsScreen(progress) {
  const s = progress.settings;
  const toggle = (key, label, description, checked) => `
    <label class="toggle">
      <span><strong>${label}</strong><small>${description}</small></span>
      <input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""} /><i></i>
    </label>`;
  return `
    <section class="screen-list" data-screen="settings">
      <header class="list-header"><button class="btn btn-icon" data-action="home" aria-label="Voltar">←</button><h1>Ajustes</h1></header>
      <div class="settings-panel">
        ${toggle("sound", "Efeitos sonoros", "Pulos, estrelas e comemorações", s.sound)}
        ${toggle("music", "Música", "Trilha sonora de cada mundo", s.music)}
        ${toggle("reducedMotion", "Menos movimento", "Desliga tremores e flashes da tela", s.reducedMotion)}
        ${toggle("challengeMode", "Modo Desafio", "Para crianças maiores: tropeçou, volta ao último checkpoint", s.challengeMode)}
        <div class="settings-footer">
          <button class="btn btn-soft" data-action="reset-progress">Apagar progresso</button>
          <small>Little Dash Adventure • VSA Soluções em Tecnologia • Os dados ficam só neste aparelho.</small>
        </div>
      </div>
    </section>`;
}

export function gameScreen(level, world) {
  return `
    <section class="screen-game" data-screen="game">
      <canvas id="game-canvas" aria-label="Área do jogo: toque para pular"></canvas>
      <div class="game-overlay">
        <button class="btn btn-icon btn-glass" data-action="pause" aria-label="Pausar">⏸</button>
        <span class="level-badge">${world.emoji} ${esc(level.name)}</span>
      </div>
      <div class="rotate-hint" aria-hidden="true">Gire o celular para jogar na horizontal ↻</div>
    </section>`;
}

export function pauseOverlay() {
  return `
    <div class="modal-backdrop" data-overlay="pause">
      <div class="modal">
        <h2>Vamos descansar?</h2>
        <button class="btn btn-primary" data-action="resume">Continuar ▶</button>
        <button class="btn btn-soft" data-action="replay">Recomeçar fase</button>
        <button class="btn btn-soft" data-action="worlds">Sair para os mundos</button>
      </div>
    </div>`;
}

export function resultsScreen({ level, world, result, outcome, next }) {
  const ratio = result.totalStars ? Math.round((result.stars / result.totalStars) * 100) : 100;
  const badges = [];
  if (result.hits === 0) badges.push("🛡️ Sem tropeços!");
  if (outcome.firstCompletion) badges.push("🎉 Primeira vez!");
  if (outcome.isNewBest && !outcome.firstCompletion) badges.push("📈 Novo recorde!");
  if (result.bestStreak >= 15) badges.push(`🔥 ${result.bestStreak} estrelas seguidas`);
  if (outcome.stickerUnlocked) badges.push(`📒 Figurinha ${world.stickers[level.index]} desbloqueada!`);
  return `
    <section class="screen-results" data-screen="results" style="--world:${world.color};--world-image:url('${world.background}')">
      <div class="results-card">
        <p class="eyebrow">Aventura concluída</p>
        <h1>${outcome.rating === 3 ? "Perfeito!" : outcome.rating === 2 ? "Muito bem!" : "Você conseguiu!"}</h1>
        <div class="rating-big">${[1, 2, 3].map((n) => `<i class="${n <= outcome.rating ? "on" : ""}" style="--delay:${n * 0.25}s">★</i>`).join("")}</div>
        <div class="results-stats">
          <div><strong>⭐ ${result.stars}</strong><small>de ${result.totalStars} (${ratio}%)</small></div>
          <div><strong>${coinDots(result.coins)}</strong><small>moedas secretas</small></div>
          <div><strong>${result.hits}</strong><small>tropeços</small></div>
          <div><strong>${Math.round(result.time)}s</strong><small>${result.challengeMode ? `${result.attempts} tentativa(s)` : "tempo"}</small></div>
        </div>
        ${badges.length ? `<div class="badges">${badges.map((badge) => `<span class="chip chip-gold">${badge}</span>`).join("")}</div>` : ""}
        <div class="button-row">
          ${next ? `<button class="btn btn-primary" data-action="play" data-level="${next.id}">Próxima: ${esc(next.name)} ▶</button>` : `<button class="btn btn-primary" data-action="worlds">Escolher mundo 🌈</button>`}
          <button class="btn btn-soft" data-action="play" data-level="${level.id}">Jogar de novo</button>
          <button class="btn btn-soft" data-action="levels" data-world="${world.id}">Fases</button>
        </div>
      </div>
    </section>`;
}

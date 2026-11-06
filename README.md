<div align="center">

# 🍭 LITTLE DASH ADVENTURE

### Um jogo de ritmo e pulos feito para crianças. Sem punições, com muita música.

**Toque no tempo da música, pule obstáculos amigáveis, colete estrelas e moedas secretas em quatro mundos.**

<br />

[🎮 Jogar a versão de teste](https://viniciusandradde.github.io/little-dash-adventure/) · [📊 Análise e Sistema Premium](docs/ANALISE-PREMIUM.md) · [🧭 Roadmap](docs/ROADMAP.md)

<br />

<img src="public/assets/worlds/candy-kingdom.webp" alt="Reino dos Doces" width="48%" />
<img src="public/assets/worlds/dinosaur-island.webp" alt="Ilha dos Dinossauros" width="48%" />

<br />

<img src="public/assets/worlds/underwater.webp" alt="Fundo do Mar" width="48%" />
<img src="public/assets/worlds/space-adventure.webp" alt="Aventura Espacial" width="48%" />

</div>

---

## ✨ O jogo

Little Dash Adventure é um *rhythm platformer* no espírito de Geometry Dash, redesenhado para
crianças pequenas: o personagem corre sozinho, um toque faz pular, segurar o dedo faz voar.
As fases são construídas em **grade de batidas**, então cada pulo cai no tempo da trilha do mundo.

- **4 mundos, 12 fases autorais** (39 a 66 segundos cada) com espinhos amigáveis, blocos,
  plataformas, buracos, pads, orbs, portais de velocidade, portais de voo, checkpoints,
  estrelas e 3 moedas secretas por fase.
- **Modo criança (padrão):** errar nunca pune. Espinho = quique por cima, buraco = a bolha
  mágica resgata, bloco baixo = o personagem sobe. Toda fase chega à meta, mesmo sem toques.
- **Modo Desafio (opcional):** tropeçou, volta ao último checkpoint, com contador de
  tentativas e sem texto de derrota. Para crianças maiores que querem o desafio de verdade.
- **Trilha sonora própria por mundo** (120, 112, 100 e 128 BPM) e 13 efeitos sonoros
  sintetizados; a cena pulsa no ritmo.
- **4 personagens** animados (Cubinho, Dino, Estrelinha e Foguetinho).
- **Progressão:** avaliação de 1 a 3 estrelas por fase, moedas, álbum de 12 figurinhas,
  medalha "sem tropeços", melhor tempo e botão "próxima aventura".
- **Ajustes:** sons, música, menos movimento, Modo Desafio, apagar progresso.

## 💛 Compromissos com a família

- Sem anúncios, sem compras, sem chat, sem cadastro e sem rastreamento.
- Sem Game Over, sem vidas e sem perda de estrelas.
- Funciona offline depois do primeiro carregamento (PWA); nenhum recurso é baixado de terceiros em tempo de execução.
- O progresso fica apenas no aparelho.

## 🕹️ Controles

| Ação | Toque | Teclado (QA) |
|---|---|---|
| Pular / segurar para pulos seguidos | Toque na tela | Espaço, ↑ ou W |
| Voar (dentro da bolha) | Segurar | Segurar espaço |
| Pausar | Botão ⏸ | P ou Esc |

## 🛠️ Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:5173/little-dash-adventure/
npm test           # 22 testes (catálogo, simulação, progresso)
npm run build
npm run preview    # http://localhost:4173/little-dash-adventure/?qa=1
```

- `src/game/levels.js` — construtor de fases em batidas e as 12 composições.
- `src/game/simulation.js` — física determinística e regras (sem DOM, testável em Node).
- `src/game/renderer.js` e `src/game/characters.js` — desenho em Canvas.
- `src/services/audio.js` — trilhas gravadas com fallback para sequenciador procedural; efeitos.
- `src/services/storage.js` — progresso versionado (v2) com migração.
- `docs/` — PRD, arquitetura, QA, roadmap e a [análise detalhada](docs/ANALISE-PREMIUM.md).

Abrir o jogo com `?qa=1` expõe `window.__lda` para automação; `node scripts/qa-smoke.cjs`
percorre as telas com Playwright, joga uma fase com um bot e verifica o áudio.

## 🏢 Uma criação da VSA Soluções em Tecnologia

Little Dash Adventure é um software de propriedade da VSA Soluções em Tecnologia. As trilhas
sonoras foram produzidas para este projeto e estão versionadas em `public/assets/music/`.

<div align="center"><sub>Feito com carinho para pequenos grandes exploradores. 💛</sub></div>

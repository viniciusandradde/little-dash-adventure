# Análise detalhada e Sistema Premium — Little Dash Adventure

> Data: novembro de 2026. Base analisada: commit `ee850d4` (versão publicada em
> https://viniciusandradde.github.io/little-dash-adventure). Referência de
> comparação: https://viniciusandradde.github.io/GeometryDash.

## 1. Diagnóstico da versão anterior

A versão gerada anteriormente tinha uma apresentação de produto (README, PRD,
roadmap) muito acima do que o jogo entregava. O problema não era "bug", era
ausência de jogo: faltavam os elementos que fazem um *dash* ser um *dash*.

### 1.1 Gameplay (o problema principal)

| Item | O que existia | Por que era ruim |
|---|---|---|
| Obstáculos | Uma fórmula `firstObstacle + i * spacing` gerava obstáculos idênticos, igualmente espaçados, para sempre. | Não existe "fase": é o mesmo trecho repetido. Não há ritmo, surpresa, nem leitura de padrão. |
| Colisão | Não existia. O jogo só checava se `playerY < floor - 12` no instante em que o obstáculo passava. | Nada toca em nada. Pular tarde ou cedo dá o mesmo resultado. |
| Tipos de elementos | 1 obstáculo por mundo, 1 estrela sempre na mesma altura. | Geometry Dash vive de variedade: espinhos, blocos, plataformas, buracos, pads, orbs, portais de velocidade e de modo. Nenhum existia. |
| Fim da fase | Timer de 38–42 segundos. | A criança não vê a meta nem sente que "chegou". O chão é infinito. |
| 12 fases | Mesmos números com nomes diferentes (`obstacleSpacing` de 620 a 480). | Zero diferença perceptível entre "Nuvens de Algodão" e "Estação das Estrelas". |
| Física | `dt` variável (até 40 ms), sem buffer de input, pulo só se `playerY >= floor - 1` e `jumpQueued` descartado no mesmo frame. | Toques um pouco antes do pouso eram perdidos (frustrante para criança). Comportamento muda com o FPS do aparelho. |
| Checkpoints / tentativas | Não existiam. | Sem modo para crianças maiores, sem loop de "tentar de novo". |

### 1.2 Apresentação

- Herói da tela inicial era um **emoji** (`🟦`), que muda de aparência por aparelho.
- O fundo WebP era arrastado por `Math.min(naturalWidth - cropW, drift)`: ao chegar
  no fim da imagem o cenário **congelava**. Um véu branco de 16% ainda lavava a arte.
- O chão era um retângulo branco a 78% da altura com 4 semicírculos laranja como
  "decoração".
- Texto de feedback desenhado com `fillText` 14px sem contorno, ilegível sobre o fundo.
- Botão "PULAR" fora do canvas roubava altura útil em celular na horizontal.
- Nenhuma partícula, nenhuma animação de estado dos personagens, nenhuma rotação
  no pulo, sem squash/stretch, sem trilha, sem tremor, sem flash.

### 1.3 Áudio

- A "música" era um MP3 externo em um CDN (CloudFront) gerado por terceiros, carregado
  com `preload="none"`. Isso **quebrava a promessa de offline**, criava uma requisição
  a terceiros (privacidade) e podia desaparecer a qualquer momento.
- Efeitos sonoros eram senos puros com início abrupto (estalos) e sem relação com o
  que acontecia na tela.

### 1.4 Progressão e dados

- `progress.stars += result.stars` a cada partida: a contagem inflava infinitamente
  ao repetir fases. Não havia melhor resultado por fase, avaliação por estrelas,
  moedas, "próxima fase" nem ajustes.
- Manifesto PWA duplicado (`/manifest.webmanifest` e `/public/manifest.webmanifest`)
  com `start_url: "/"` errado para o subcaminho do GitHub Pages.
- CI sem lockfile; apenas 6 testes, todos sobre números de configuração.

### 1.5 Código

- `engine.js` misturava atualização, renderização e regra de fase; a posição dos
  obstáculos era recalculada por fórmula em dois lugares diferentes.
- Nenhum módulo era testável sem navegador.

## 2. O Sistema Premium

A reescrita mantém os princípios do PRD (sem Game Over, sem anúncios, sem compras,
offline, progresso local) e troca o "miolo" por uma arquitetura de jogo real.

### 2.1 Fases em grade de batidas (DNA do Geometry Dash)

`src/game/levels.js` tem um construtor de fases que mede **tudo em batidas da
música** (`beats`), convertendo para distância com a velocidade atual. Resultado:
cada pulo cai no tempo da trilha do mundo (Doces 120 BPM, Dinos 112, Mar 100,
Espaço 128).

Padrões disponíveis: `singles`, `doubles`, `triple`, `blockHop`, `stairs`,
`gapJump`, `platformRun`, `padLaunch`, `orbGap`, `speedBurst`, `slowGroove`,
`flyCorridor`, `breather`, `finale`. As 12 fases são composições autorais desses
padrões (ver `DESIGNS`), com dificuldade crescente:

- Mundo 1 ensina pulo simples, duplo, blocos, plataformas, pad e orb.
- Mundo 2 apresenta o **modo voo** (bolha mágica: segurar para subir).
- Mundos 3 e 4 combinam velocidade, voo mais longo, escadas e triplos.

Cada fase tem **3 checkpoints**, **3 moedas secretas** em caminhos alternativos
(plataformas altas, escadas, corredores de voo) e 52–75 estrelas. Duração entre
39 e 66 segundos.

### 2.2 Simulação determinística (`src/game/simulation.js`)

- Passo fixo de 1/120 s com acumulador: o jogo é idêntico em qualquer FPS.
- Buffer de input (160 ms) e *coyote time* (100 ms): o toque "quase certo" conta.
- Segurar o dedo repete o pulo ao pousar (igual ao GD).
- Colisão real: blocos (pousar, bater a cabeça, bater de lado), plataformas de
  mão única, buracos no chão, espinhos com *hitbox* perdoadora, pads, orbs (toque
  dentro do orb), portais de velocidade, portais de voo, checkpoints e meta.
- Rotação 90° por pulo, squash & stretch, partículas (poeira, faíscas, confete,
  trilha de voo), textos flutuantes, tremor e flash controlados pela simulação.
- **Modo criança (padrão):** errar nunca pune. Espinho = quique por cima;
  buraco = a bolha resgata; bloco baixo = o personagem "sobe" nele. A fase sempre
  chega à meta, mesmo sem nenhum toque (teste automatizado garante).
- **Modo Desafio (opcional, em Ajustes):** tropeçou, volta ao último checkpoint,
  com contador de tentativas e sem texto de derrota. Estrelas já coletadas nunca
  são perdidas.

### 2.3 Renderização (`src/game/renderer.js`, `src/game/characters.js`)

- Espaço lógico de 360 unidades de altura: o jogo tem a mesma proporção em
  qualquer tela, com DPR até 2.5.
- Fundo WebP em *parallax* com ladrilho espelhado (nunca congela), camada
  intermediária procedural por mundo (pirulitos, palmeiras, algas, planetas),
  chão temático com padrões (granulado, grama, areia, crateras) e buracos reais.
- Obstáculos amigáveis desenhados por tema: bala espinhosa, cacto, ouriço, cristal;
  todos com olhinhos sonolentos. Blocos, plataformas, pads, orbs, portais, bandeiras
  de checkpoint e arco de META.
- Quatro personagens vetoriais com estados (correndo, pulando, voando, feliz),
  rotação adequada a cada um, bolha de voo e piscada de invulnerabilidade.
- HUD com barra de progresso, estrelas, moedas, combo e dicas contextuais, com
  texto sempre contornado.
- Cena pulsa suavemente no tempo da música (`beatPhase`). Opção "Menos movimento"
  desliga tremor, flash e pulso.

### 2.4 Trilha sonora e efeitos (`src/services/audio.js`)

- Sequenciador Web Audio com bateria (bumbo, caixa, chimbal), baixo, acordes e
  melodia gerada por semente, uma identidade por mundo (escala, timbre, swing,
  andamento) e um tema de menu. Zero downloads: funciona offline e sem terceiros.
- Intensidade da música sobe com combos e cai nos tropeços.
- 13 efeitos com envelope (sem estalos): pulo, pouso, estrela com afinação que sobe
  com a sequência, moeda, pad, orb, tropeço suave, bolha, checkpoint, velocidade,
  portal, fanfarra de meta e clique de interface.
- Suporte a trilhas em arquivo (`public/assets/music/*.mp3`) com *fallback*
  automático para o sequenciador quando o arquivo não existe ou falha.

### 2.5 Progressão (`src/services/storage.js`)

- Esquema v2 com **migração** do v1 (nada do que a criança já conquistou é perdido).
- Por fase: concluída, melhor estrelas, avaliação 1–3 estrelas (45% / 75% das
  estrelas), moedas, "sem tropeços", melhor tempo, tentativas.
- Álbum de figurinhas: 12 figurinhas desbloqueadas com as 3 moedas de cada fase.
- Fluxo "Próxima aventura" direto da tela de resultado.
- Ajustes: sons, música, menos movimento, Modo Desafio, apagar progresso.

### 2.6 Qualidade

- 22 testes automatizados (`npm test`): catálogo, viabilidade física de cada pulo,
  conclusão sem input nas 12 fases, bot que limpa as fases, determinismo, buffer
  de input, invulnerabilidade, modo desafio, portais, migração e progressão.
- Harness de QA no navegador: `?qa=1` expõe `window.__lda` (simulação, áudio,
  `setTimeScale`) para automação com Playwright.

## 3. Como continuar

1. **Trilhas gravadas:** colocar `candy.mp3`, `dino.mp3`, `ocean.mp3`, `space.mp3`
   e `menu.mp3` em `public/assets/music/` (ver `MUSIC_TRACKS` em `config.js`).
2. **Sprites ilustrados:** `characters.js` isola o desenho; pode ser trocado por
   atlas PNG sem tocar na simulação.
3. **Mais fases:** adicionar entradas em `DESIGNS` (`levels.js`) — cada fase são
   algumas linhas de padrões.
4. **Testes em Android real:** medir FPS em aparelhos de entrada e ajustar
   `maxStepsPerFrame`/partículas se necessário.

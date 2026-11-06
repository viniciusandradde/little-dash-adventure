# Arquitetura

## Diretriz
Aplicação estática, sem backend, com módulos ES nativos e Vite para desenvolvimento e build. A simulação do jogo é pura (sem DOM) e pode ser executada em testes Node; a renderização e o áudio são camadas separadas que observam a simulação.

## Camadas
| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Configuração | `src/config.js` | Física (espaço lógico de 360 u), mundos, personagens, temas visuais, trilhas, regras de avaliação. |
| Fases | `src/game/levels.js` | Construtor em grade de batidas (`LevelBuilder`), biblioteca de padrões e as 12 composições (`DESIGNS`). |
| Simulação | `src/game/simulation.js` | Passo fixo de 1/120 s, input com buffer, colisões, modos cubo/voo, modo criança e modo desafio, partículas, eventos. Sem DOM. |
| Renderização | `src/game/renderer.js`, `src/game/characters.js` | Canvas 2D: parallax, cenário procedural, chão temático, entidades, personagens, partículas, HUD. |
| Engine | `src/game/engine.js` | Loop `requestAnimationFrame`, input (pointer e teclado), ponte entre simulação, renderização e UI. |
| Áudio | `src/services/audio.js` | Trilhas gravadas por mundo com fallback para sequenciador procedural; efeitos sintetizados; fase da batida para o renderer. |
| Progresso | `src/services/storage.js` | Esquema v2 versionado com migração do v1; avaliação, moedas, figurinhas, ajustes. |
| UI | `src/ui/screens.js`, `src/main.js`, `src/styles.css` | Telas (início, mundos, fases, personagens, álbum, ajustes, jogo, pausa, resultado) e navegação. |
| PWA | `public/sw.js`, `manifest.webmanifest` | Cache offline do shell, fundos e trilhas. |

## Ciclo de jogo
1. A UI escolhe fase e personagem e cria `GameEngine` com um canvas.
2. `GameEngine` cria `Simulation(level)` e `Renderer(canvas)`.
3. A cada frame o engine acumula o tempo real e chama `simulation.advance(dt)`, que executa passos fixos.
4. A simulação emite eventos (`jump`, `star`, `coin`, `mistake`, `checkpoint`, `finish`, `complete`…); `main.js` os traduz em sons e intensidade da música.
5. O renderer desenha o estado atual com a fase da batida fornecida pelo áudio.
6. Em `complete`, `recordResult` atualiza o progresso e a UI mostra a tela de resultado.

## Decisões
- **Grade de batidas:** fases medem distâncias em batidas para que pulos coincidam com a música.
- **Simulação pura:** permite 22 testes automatizados, incluindo "toda fase conclui sem input" e bots que jogam as fases.
- **Espaço lógico fixo:** a altura visível é sempre 360 unidades; largura varia com a proporção do aparelho.
- **Sem framework de UI:** HTML por template string com delegação de eventos.
- **Áudio híbrido:** trilhas MP3 locais quando existem; sequenciador Web Audio quando não.

## QA no navegador
Abra a aplicação com `?qa=1` para expor `window.__lda` (`engine`, `sim`, `audio`, `setTimeScale`). O script `scripts/qa-smoke.cjs` usa Playwright para percorrer as telas, jogar com um bot e verificar áudio.

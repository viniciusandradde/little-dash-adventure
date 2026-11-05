# Arquitetura

## Diretriz
Aplicação estática, sem backend, com módulos ES nativos e Vite como servidor de desenvolvimento/build. O motor de jogo é independente da interface e recebe callbacks para eventos de gameplay.

## Camadas
- **UI:** telas de início, seleção de mundos/fases/personagens, HUD, pausa e vitória.
- **Game Engine:** loop, física, renderização, assistência e eventos.
- **Domain/config:** catálogo de mundos, personagens, níveis e parâmetros.
- **Storage:** leitura e gravação versionada em localStorage.
- **PWA:** manifest e service worker para cache.

## Estrutura
```
assets/
  icon.svg
src/
  config.js
  main.js
  styles.css
  game/
    engine.js
    level-data.js
  services/
    storage.js
public/
  sw.js
docs/
  PRD.md
  ARCHITECTURE.md
  ROADMAP.md
  QA.md
```

## Ciclo de jogo
1. UI seleciona nível e personagem.
2. Engine inicia com estado limpo.
3. requestAnimationFrame calcula delta time e atualiza física.
4. Assistência aplica pulo leve quando necessário.
5. Coleta e progresso são emitidos por callbacks.
6. Tempo de fase termina e chama onComplete.
7. UI persiste estrelas e conclusão localmente.

## Decisões
- Canvas 2D: simples, leve e compatível com Android.
- Sem framework de UI: reduzir peso e complexidade.
- localStorage: suficiente para progresso não sensível e offline.
- Sem servidor: jogo funciona como conteúdo estático.
- PWA: instalável e cacheável sem loja de aplicativos.

## Evolução
Separar física, colisões, assistência, renderização e áudio em módulos próprios quando o protótipo for validado em aparelho real. Não introduzir abstrações antes de existir necessidade comprovada.

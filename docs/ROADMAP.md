# Roadmap — Little Dash Adventure

## Estado atual (Sistema Premium)
- [x] Simulação determinística com passo fixo, buffer de input e coyote time.
- [x] 12 fases autorais em grade de batidas com espinhos, blocos, plataformas, buracos, pads, orbs, portais de velocidade, portais de voo, checkpoints, moedas secretas e meta.
- [x] Modo criança (sem punição, conclusão garantida) e Modo Desafio (checkpoints e tentativas).
- [x] Renderização com parallax, cenário procedural por mundo, obstáculos temáticos, partículas, HUD e personagens com estados.
- [x] Trilhas gravadas para os 4 mundos com fallback procedural; efeitos sintetizados.
- [x] Progressão v2: avaliação 1–3 estrelas, moedas, álbum de figurinhas, "sem tropeços", melhor tempo, próxima fase.
- [x] Ajustes: sons, música, menos movimento, Modo Desafio, apagar progresso.
- [x] 22 testes automatizados (`npm test`) e harness de QA (`?qa=1`).
- [ ] Trilha gravada para o menu (hoje usa o sequenciador procedural).
- [ ] Sprites ilustrados para personagens e obstáculos (hoje vetoriais em Canvas).
- [ ] Testes em Android real e medição de FPS em aparelhos de entrada.
- [ ] Política de privacidade e checklist de publicação.

## Próximas fases
### F1 — Conteúdo
- Mais padrões (bolas saltitantes, plataformas móveis, portal de gravidade suave).
- Fase bônus por mundo desbloqueada pelas figurinhas.
- Comemorações especiais por personagem.

### F2 — Polimento
- Tutorial interativo na primeira fase com setas animadas.
- Vibração leve (Vibration API) opcional nos acertos.
- Modo "assistido" com pulo automático para crianças menores de 3 anos.

### F3 — Distribuição
- Empacotamento Android (Capacitor) com splash screen.
- Testes de instalação PWA e atualização de cache.

## Critério de conclusão
Uma fase só pode ser marcada como concluída quando os critérios de aceite em QA.md forem verificados e a evidência de teste estiver registrada.

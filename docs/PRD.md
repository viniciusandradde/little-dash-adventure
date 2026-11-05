# PRD — Little Dash Adventure

## 1. Visão do produto
Jogo de plataforma infantil para crianças pequenas, com foco inicial em 4 anos. A experiência deve ser acolhedora, acessível, previsível e divertida. O sucesso é participar e concluir a aventura, não obter pontuação competitiva.

## 2. Público e plataforma
- Público primário: crianças em idade pré-escolar.
- Plataforma prioritária: Android em navegador moderno.
- Orientação: paisagem durante gameplay.
- Distribuição: aplicação web instalável (PWA), sem backend.

## 3. Princípios obrigatórios
1. Nunca exibir Game Over.
2. Não implementar vidas, dano, perda de progresso ou reinício obrigatório.
3. Conclusão garantida mesmo sem input.
4. Obstáculos não podem bloquear ou punir.
5. Assistência automática deve ser discreta, configurável e previsível.
6. Não incluir anúncios, compras, links externos, chat, login ou rastreamento.
7. Textos curtos, ícones claros e alvos de toque grandes.
8. Áudio desligável e sem sustos/sons agressivos.

## 4. Escopo funcional
- Início com Jogar, Personagens, Mundos e áudio.
- Quatro mundos, todos disponíveis desde o início.
- Três fases por mundo (12 fases).
- Quatro personagens desbloqueados desde o início.
- Movimento automático; toque para pular.
- Pulo assistido opcional, coleta assistida de estrelas e recuperação automática.
- Pausa e retomada.
- Tela de comemoração e acesso à próxima aventura.
- Persistência local versionada.

## 5. Mundos e fases
| Mundo | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|
| Reino dos Doces | Nuvens de Algodão | Ponte de Chocolate | Castelo de Pirulitos |
| Ilha dos Dinossauros | Vale dos Ovinhos | Floresta Amiga | Vulcão de Sorvete |
| Fundo do Mar | Bolhas Mágicas | Jardim de Coral | Tesouro da Tartaruga |
| Aventura Espacial | Lua de Queijo | Anéis de Saturno | Estação das Estrelas |

## 6. Personagens
Cubinho, Dino, Estrelinha e Foguetinho. Cada personagem deve ter estados visuais: parado, correndo, pulando, comemorando e expressão feliz.

## 7. Requisitos não funcionais
- Canvas com resolução lógica independente do DPR.
- Loop requestAnimationFrame com delta time limitado.
- Pointer Events para toque e mouse.
- PWA com cache offline após primeiro carregamento.
- Persistência local com schemaVersion.
- Meta de 60 FPS em aparelhos compatíveis; manter jogabilidade em dispositivos de entrada.
- Não coletar dados pessoais.

## 8. Critérios de aceite
- CA01: começar com um toque.
- CA02: pular por toque no canvas e botão grande.
- CA03: não há estado de morte nem Game Over.
- CA04: personagem sempre recupera a altura/plataforma.
- CA05: estrelas são contabilizadas sem exigir precisão.
- CA06: 12 fases configuradas e selecionáveis.
- CA07: 4 mundos acessíveis desde o início.
- CA08: 4 personagens selecionáveis desde o início.
- CA09: progresso sobrevive ao reload.
- CA10: gameplay utilizável em Android.
- CA11: shell e assets essenciais disponíveis offline após cache.
- CA12: nível conclui mesmo sem input.

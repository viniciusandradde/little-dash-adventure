# Roadmap — Little Dash Adventure

> Statuso atualizado pela auditoria técnica inicial. Itens planejados não devem ser interpretados como implementados.

## Estado atual
- [x] Aplicação web estática com Vite e JavaScript ES modules.
- [x] Engine Canvas com loop de animação, pulo, HUD e conclusão temporizada.
- [x] Catálogo de 4 mundos × 3 níveis gerado por configuração.
- [x] Seleção de personagem, mundo e fase.
- [x] Persistência local de progresso.
- [x] Manifesto PWA e service worker inicial.
- [ ] Arte final e animações originais por mundo.
- [ ] Colisão e interação real com obstáculos e colecionáveis.
- [ ] Testes automatizados de engine, progresso e navegação.
- [ ] Auditoria de acessibilidade, desempenho e Android real.

## Fases
### F0 — Fundação e confiabilidade
- Corrigir e testar o ciclo de vida da engine.
- Garantir que resize, pause, resume, restart e destroy não criem loops duplicados.
- Corrigir contabilização de estrelas e assistência.
- Validar cache offline e fallback.
- Definir contratos de dados e versionamento do save.

### F1 — MVP jogável
- Implementar obstáculos, colecionáveis e feedback visual.
- Criar três fases distintas por mundo.
- Adicionar feedback sonoro opcional, com controle parental.
- Validar toque, teclado para QA e proporções de tela.

### F2 — Conteúdo e experiência
- Ilustrações e animações originais.
- Acessibilidade: contraste, áreas de toque, movimento reduzido e ausência de flashes.
- Tutorial curto e opção de pular tutorial.

### F3 — PWA e distribuição
- Testes em Android Chrome e instalação PWA.
- Estratégia de atualização de cache e recuperação de versão.
- Otimização de carregamento e memória.
- Política de privacidade antes de qualquer publicação.

## Critério de conclusão
Uma fase só pode ser marcada como concluída quando os critérios de aceite em QA.md forem verificados e a evidência de teste estiver registrada.

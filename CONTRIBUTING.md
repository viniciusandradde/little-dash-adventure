# Contribuindo

## Princípios
1. Segurança, bem-estar e melhor interesse da criança acima de métricas de engajamento.
2. Não introduzir anúncios, compras, chat, rastreamento ou links externos.
3. Não adicionar dependências sem justificar benefício, peso e risco.
4. Manter o jogo funcional offline depois do carregamento inicial.
5. Preservar acessibilidade e controles simples.

## Fluxo
1. Criar branch a partir de main.
2. Descrever objetivo, impacto e risco.
3. Implementar mudanças pequenas e isoladas.
4. Executar npm ci, npm test e npm run build.
5. Abrir pull request com evidências e checklist de QA.

## Padrões
- JavaScript ES modules.
- Funções puras para regras de dados sempre que possível.
- Evitar estado global desnecessário.
- Usar delta time no loop de jogo.
- Versionar alterações no formato de persistência.
- Comentar decisões e invariantes.

## Pull request
- [ ] Escopo e motivação descritos.
- [ ] Testes executados.
- [ ] Sem dados pessoais ou segredos adicionados.
- [ ] Sem dependências/ativos de terceiros sem licença registrada.
- [ ] Critérios de QA atualizados.
